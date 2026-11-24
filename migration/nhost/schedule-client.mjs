// Isolated proof of concept. Never loaded by the live Mawaeidi site.
// Access token comes from Nhost Auth's verified user session, never an admin secret.
export function createScheduleClient({graphqlUrl, getAccessToken, fetchImpl = globalThis.fetch}) {
  const url = new URL(graphqlUrl);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.nhost.run') ||
      !url.hostname.includes('.graphql.') || url.pathname !== '/v1' ||
      url.username || url.password || url.search || url.hash) {
    throw new Error('Expected an Nhost HTTPS GraphQL /v1 endpoint');
  }
  async function request(query, variables = {}) {
    const token = await getAccessToken();
    if (typeof token !== 'string' || !token.trim()) throw new Error('authentication_required');
    const response = await fetchImpl(url.href, {
      method: 'POST',
      headers: {'Content-Type':'application/json', Authorization: 'Bearer ' + token},
      body: JSON.stringify({query, variables}),
      cache: 'no-store',
      credentials: 'omit'
    });
    if (!response.ok) throw new Error('backend_http_' + response.status);
    const result = await response.json();
    if (result.errors?.length || !result.data) throw new Error('graphql_request_failed');
    return result.data;
  }
  return {
    async load() {
      const data = await request('query { mawaeidi_data(limit: 1) { lessons updated_at } }');
      const rows = data.mawaeidi_data;
      if (!Array.isArray(rows) || rows.length > 1) throw new Error('unexpected_response');
      if (rows.length === 0) return null;
      if (!Array.isArray(rows[0].lessons)) throw new Error('invalid_lessons');
      return rows[0];
    },
    async save(lessons) {
      if (!Array.isArray(lessons)) throw new TypeError('lessons must be an array');
      const data = await request(
        'mutation Save($lessons: jsonb!, $updated: timestamptz!) { insert_mawaeidi_data_one(object: {lessons: $lessons, updated_at: $updated}, on_conflict: {constraint: mawaeidi_data_pkey, update_columns: [lessons, updated_at]}) { updated_at } }',
        {lessons, updated: new Date().toISOString()}
      );
      if (!data.insert_mawaeidi_data_one?.updated_at) throw new Error('save_not_confirmed');
      return data.insert_mawaeidi_data_one;
    }
  };
}
