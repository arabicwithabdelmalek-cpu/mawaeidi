package com.abdelmalek.mawaeidi;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.net.HttpURLConnection;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "MawaeidiMobile")
public class MawaeidiMobilePlugin extends Plugin {
    private static final String KEY_ALIAS = "mawaeidi-auth-aes-v1";
    private static final long MAX_APK_BYTES = 150L * 1024 * 1024;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final java.util.concurrent.atomic.AtomicBoolean updating = new java.util.concurrent.atomic.AtomicBoolean();

    private SharedPreferences authStore() {
        return getContext().getSharedPreferences("mawaeidi_auth_secure_v1", Context.MODE_PRIVATE);
    }

    private synchronized SecretKey key() throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore");
        store.load(null);
        if (!store.containsAlias(KEY_ALIAS)) {
            KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
            generator.init(new KeyGenParameterSpec.Builder(KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());
            generator.generateKey();
        }
        return (SecretKey) store.getKey(KEY_ALIAS, null);
    }

    private String storageKey(PluginCall call) {
        String name = call.getString("key", "");
        if (!name.matches("sb-[A-Za-z0-9_-]{1,160}-auth-token(?:-[A-Za-z0-9_-]{1,64})?"))
            throw new IllegalArgumentException("invalid_auth_key");
        return name;
    }

    @PluginMethod
    public void getAuthItem(PluginCall call) {
        try {
            String name = storageKey(call);
            String saved = authStore().getString(name, null);
            JSObject result = new JSObject();
            if (saved != null) {
                String[] parts = saved.split(":", 2);
                Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
                cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, Base64.decode(parts[0], Base64.NO_WRAP)));
                cipher.updateAAD(name.getBytes(StandardCharsets.UTF_8));
                result.put("value", new String(cipher.doFinal(Base64.decode(parts[1], Base64.NO_WRAP)), StandardCharsets.UTF_8));
            }
            call.resolve(result);
        } catch (Exception error) { call.reject("secure_auth_read_failed"); }
    }

    @PluginMethod
    public void setAuthItem(PluginCall call) {
        try {
            String name = storageKey(call);
            String value = call.getString("value");
            if (value == null || value.length() > 262144) throw new IllegalArgumentException();
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key());
            cipher.updateAAD(name.getBytes(StandardCharsets.UTF_8));
            String encrypted = Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP) + ":" +
                Base64.encodeToString(cipher.doFinal(value.getBytes(StandardCharsets.UTF_8)), Base64.NO_WRAP);
            if (!authStore().edit().putString(name, encrypted).commit()) throw new IllegalStateException();
            call.resolve();
        } catch (Exception error) { call.reject("secure_auth_write_failed"); }
    }

    @PluginMethod
    public void removeAuthItem(PluginCall call) {
        try {
            if (!authStore().edit().remove(storageKey(call)).commit()) throw new IllegalStateException();
            call.resolve();
        } catch (Exception error) { call.reject("secure_auth_remove_failed"); }
    }

    private boolean trustedInitial(URL url) {
        return "https".equals(url.getProtocol()) && "github.com".equalsIgnoreCase(url.getHost())
            && url.getUserInfo() == null && (url.getPort() == -1 || url.getPort() == 443)
            && url.getPath().matches("/arabicwithabdelmalek-cpu/mawaeidi/releases/download/v[0-9A-Za-z.-]+/Mawaeidi-[0-9A-Za-z.-]+\\.apk");
    }

    private boolean trustedRedirect(URL url) {
        return "https".equals(url.getProtocol()) && url.getUserInfo() == null
            && (url.getPort() == -1 || url.getPort() == 443)
            && (trustedInitial(url) || "release-assets.githubusercontent.com".equalsIgnoreCase(url.getHost())
            || "objects.githubusercontent.com".equalsIgnoreCase(url.getHost()));
    }

    private HttpURLConnection connect(URL url) throws Exception {
        for (int i = 0; i < 6; i++) {
            if (!trustedRedirect(url)) throw new SecurityException("untrusted_redirect");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(20000);
            connection.setReadTimeout(30000);
            connection.setRequestProperty("User-Agent", "Mawaeidi-Android");
            int status = connection.getResponseCode();
            if (status >= 300 && status < 400) {
                String location = connection.getHeaderField("Location");
                connection.disconnect();
                if (location == null) throw new IllegalStateException("missing_redirect");
                url = new URL(url, location);
            } else if (status == 200) {
                return connection;
            } else {
                connection.disconnect();
                throw new IllegalStateException("download_failed");
            }
        }
        throw new IllegalStateException("too_many_redirects");
    }

    private void download(URL url, String digest, File target) throws Exception {
        HttpURLConnection connection = connect(url);
        try {
            long expected = connection.getContentLengthLong();
            if (expected > MAX_APK_BYTES) throw new IllegalStateException("apk_too_large");
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            try (InputStream input = connection.getInputStream(); FileOutputStream output = new FileOutputStream(target)) {
                byte[] buffer = new byte[65536];
                long total = 0;
                int length;
                while ((length = input.read(buffer)) != -1) {
                    total += length;
                    if (total > MAX_APK_BYTES) throw new IllegalStateException("apk_too_large");
                    sha.update(buffer, 0, length);
                    output.write(buffer, 0, length);
                }
                if (total == 0 || (expected > 0 && total != expected)) throw new IllegalStateException("incomplete_apk");
            }
            StringBuilder actual = new StringBuilder();
            for (byte b : sha.digest()) actual.append(String.format(java.util.Locale.ROOT, "%02x", b & 255));
            if (!actual.toString().equalsIgnoreCase(digest)) throw new SecurityException("apk_checksum_mismatch");
        } finally { connection.disconnect(); }
    }

    @SuppressWarnings("deprecation")
    private void verifyPackage(File apk) throws Exception {
        PackageManager manager = getContext().getPackageManager();
        int flags = Build.VERSION.SDK_INT >= 28 ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES;
        PackageInfo installed = manager.getPackageInfo(getContext().getPackageName(), flags);
        PackageInfo candidate = manager.getPackageArchiveInfo(apk.getAbsolutePath(), flags);
        if (candidate == null || !installed.packageName.equals(candidate.packageName)) throw new SecurityException("wrong_package");
        long oldCode = Build.VERSION.SDK_INT >= 28 ? installed.getLongVersionCode() : installed.versionCode;
        long newCode = Build.VERSION.SDK_INT >= 28 ? candidate.getLongVersionCode() : candidate.versionCode;
        if (newCode <= oldCode) throw new SecurityException("not_newer");
        Signature[] oldSignatures = Build.VERSION.SDK_INT >= 28 && installed.signingInfo != null
            ? installed.signingInfo.getApkContentsSigners() : installed.signatures;
        Signature[] newSignatures = Build.VERSION.SDK_INT >= 28 && candidate.signingInfo != null
            ? candidate.signingInfo.getApkContentsSigners() : candidate.signatures;
        if (oldSignatures == null || newSignatures == null || oldSignatures.length == 0
            || !new java.util.HashSet<>(Arrays.asList(oldSignatures)).equals(new java.util.HashSet<>(Arrays.asList(newSignatures))))
            throw new SecurityException("wrong_signature");
    }

    @PluginMethod
    public void installUpdate(PluginCall call) {
        final URL url;
        final String digest = call.getString("sha256", "");
        try {
            url = new URL(call.getString("url", ""));
            if (!trustedInitial(url) || !digest.matches("[a-fA-F0-9]{64}")) throw new SecurityException();
        } catch (Exception error) { call.reject("untrusted_update"); return; }
        if (Build.VERSION.SDK_INT >= 26 && !getContext().getPackageManager().canRequestPackageInstalls()) {
            try {
                getActivity().startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + getContext().getPackageName())));
                JSObject result = new JSObject();
                result.put("permissionRequired", true);
                call.resolve(result);
            } catch (Exception error) { call.reject("install_permission_unavailable"); }
            return;
        }
        if (!updating.compareAndSet(false, true)) { call.reject("update_in_progress"); return; }
        worker.execute(() -> {
            File apk = new File(getContext().getCacheDir(), "mawaeidi-update.apk");
            try {
                download(url, digest, apk);
                verifyPackage(apk);
                Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", apk);
                Intent intent = new Intent(Intent.ACTION_VIEW)
                    .setDataAndType(uri, "application/vnd.android.package-archive")
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                JSObject result = new JSObject();
                result.put("installerOpened", true);
                call.resolve(result);
            } catch (Exception error) {
                apk.delete();
                call.reject("update_download_or_verification_failed");
            } finally { updating.set(false); }
        });
    }
}
