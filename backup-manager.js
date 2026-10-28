(function installMawaeidiBackupManager(){
"use strict";

const MAX_ARCHIVE_BYTES=256*1024*1024;
const MAX_ENTRY_BYTES=64*1024*1024;
const MAX_FILES=5000;
const ZIP_UTF8_FLAG=0x0800;
const encoder=new TextEncoder();
const decoder=new TextDecoder("utf-8",{fatal:true});

const CRC_TABLE=(()=>{
  const table=new Uint32Array(256);
  for(let index=0;index<256;index++){
    let value=index;
    for(let bit=0;bit<8;bit++)value=(value&1)?(0xedb88320^(value>>>1)):(value>>>1);
    table[index]=value>>>0;
  }
  return table;
})();

function fail(code){
  const error=new Error(code);
  error.code=code;
  throw error;
}
function crc32(bytes){
  let crc=0xffffffff;
  for(const byte of bytes)crc=CRC_TABLE[(crc^byte)&0xff]^(crc>>>8);
  return (crc^0xffffffff)>>>0;
}
function concatBytes(parts){
  const total=parts.reduce((sum,part)=>sum+part.length,0);
  const output=new Uint8Array(total);
  let offset=0;
  for(const part of parts){output.set(part,offset);offset+=part.length}
  return output;
}
async function toBytes(value){
  if(typeof value==="string")return encoder.encode(value);
  if(value instanceof Uint8Array)return value;
  if(value instanceof ArrayBuffer)return new Uint8Array(value);
  if(typeof Blob!=="undefined"&&value instanceof Blob)return new Uint8Array(await value.arrayBuffer());
  fail("unsupported_value");
}
function safeEntryName(value){
  if(typeof value!=="string"||!value||value.length>1024||value.includes("\\")||value.includes("\0"))fail("unsafe_path");
  if(value.startsWith("/")||/^[A-Za-z]:/.test(value))fail("unsafe_path");
  const parts=value.split("/");
  if(parts.some(part=>!part||part==="."||part===".."))fail("unsafe_path");
  return value;
}
function zipDateTime(date=new Date()){
  const safe=date instanceof Date&&!Number.isNaN(date.getTime())?date:new Date();
  const year=Math.min(2107,Math.max(1980,safe.getFullYear()));
  return {
    time:((safe.getHours()&31)<<11)|((safe.getMinutes()&63)<<5)|((Math.floor(safe.getSeconds()/2))&31),
    date:(((year-1980)&127)<<9)|(((safe.getMonth()+1)&15)<<5)|(safe.getDate()&31)
  };
}
async function createZip(files){
  if(!Array.isArray(files)||!files.length||files.length>MAX_FILES)fail("invalid_file_count");
  const seen=new Set();
  const prepared=[];
  let totalData=0;
  for(const file of files){
    const name=safeEntryName(file?.name);
    if(name.endsWith("/")||seen.has(name))fail("duplicate_or_directory");
    seen.add(name);
    const nameBytes=encoder.encode(name);
    const data=await toBytes(file.data);
    if(nameBytes.length>65535||data.length>MAX_ENTRY_BYTES)fail("entry_too_large");
    totalData+=data.length;
    if(totalData>MAX_ARCHIVE_BYTES)fail("archive_too_large");
    prepared.push({name,nameBytes,data,modifiedAt:file.modifiedAt});
  }

  const localParts=[];
  const centralParts=[];
  let localOffset=0;
  for(const file of prepared){
    const checksum=crc32(file.data);
    const stamp=zipDateTime(file.modifiedAt);
    const localHeader=new Uint8Array(30+file.nameBytes.length);
    const localView=new DataView(localHeader.buffer);
    localView.setUint32(0,0x04034b50,true);
    localView.setUint16(4,20,true);
    localView.setUint16(6,ZIP_UTF8_FLAG,true);
    localView.setUint16(8,0,true);
    localView.setUint16(10,stamp.time,true);
    localView.setUint16(12,stamp.date,true);
    localView.setUint32(14,checksum,true);
    localView.setUint32(18,file.data.length,true);
    localView.setUint32(22,file.data.length,true);
    localView.setUint16(26,file.nameBytes.length,true);
    localView.setUint16(28,0,true);
    localHeader.set(file.nameBytes,30);
    localParts.push(localHeader,file.data);

    const centralHeader=new Uint8Array(46+file.nameBytes.length);
    const centralView=new DataView(centralHeader.buffer);
    centralView.setUint32(0,0x02014b50,true);
    centralView.setUint16(4,20,true);
    centralView.setUint16(6,20,true);
    centralView.setUint16(8,ZIP_UTF8_FLAG,true);
    centralView.setUint16(10,0,true);
    centralView.setUint16(12,stamp.time,true);
    centralView.setUint16(14,stamp.date,true);
    centralView.setUint32(16,checksum,true);
    centralView.setUint32(20,file.data.length,true);
    centralView.setUint32(24,file.data.length,true);
    centralView.setUint16(28,file.nameBytes.length,true);
    centralView.setUint16(30,0,true);
    centralView.setUint16(32,0,true);
    centralView.setUint16(34,0,true);
    centralView.setUint16(36,0,true);
    centralView.setUint32(38,0,true);
    centralView.setUint32(42,localOffset,true);
    centralHeader.set(file.nameBytes,46);
    centralParts.push(centralHeader);
    localOffset+=localHeader.length+file.data.length;
  }

  const centralDirectory=concatBytes(centralParts);
  const endRecord=new Uint8Array(22);
  const endView=new DataView(endRecord.buffer);
  endView.setUint32(0,0x06054b50,true);
  endView.setUint16(4,0,true);
  endView.setUint16(6,0,true);
  endView.setUint16(8,prepared.length,true);
  endView.setUint16(10,prepared.length,true);
  endView.setUint32(12,centralDirectory.length,true);
  endView.setUint32(16,localOffset,true);
  endView.setUint16(20,0,true);
  const bytes=concatBytes([...localParts,centralDirectory,endRecord]);
  if(bytes.length>MAX_ARCHIVE_BYTES)fail("archive_too_large");
  return new Blob([bytes],{type:"application/zip"});
}
function findEndRecord(bytes){
  const minimum=Math.max(0,bytes.length-22-65535);
  for(let offset=bytes.length-22;offset>=minimum;offset--){
    if(bytes[offset]===0x50&&bytes[offset+1]===0x4b&&bytes[offset+2]===0x05&&bytes[offset+3]===0x06)return offset;
  }
  fail("missing_end_record");
}
async function readZip(input){
  const bytes=await toBytes(input);
  if(bytes.length>MAX_ARCHIVE_BYTES)fail("archive_too_large");
  if(bytes.length<22)fail("invalid_zip");
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const endOffset=findEndRecord(bytes);
  if(endOffset+22>bytes.length)fail("invalid_end_record");
  const commentLength=view.getUint16(endOffset+20,true);
  if(endOffset+22+commentLength!==bytes.length)fail("invalid_end_record");
  if(view.getUint16(endOffset+4,true)!==0||view.getUint16(endOffset+6,true)!==0)fail("multi_disk_zip");
  const diskEntries=view.getUint16(endOffset+8,true);
  const totalEntries=view.getUint16(endOffset+10,true);
  const centralSize=view.getUint32(endOffset+12,true);
  const centralOffset=view.getUint32(endOffset+16,true);
  if(totalEntries===0xffff||centralSize===0xffffffff||centralOffset===0xffffffff)fail("zip64_not_supported");
  if(diskEntries!==totalEntries||totalEntries>MAX_FILES)fail("invalid_file_count");
  if(centralOffset+centralSize!==endOffset)fail("invalid_central_directory");

  const entries=new Map();
  let cursor=centralOffset;
  let totalData=0;
  for(let index=0;index<totalEntries;index++){
    if(cursor+46>centralOffset+centralSize||view.getUint32(cursor,true)!==0x02014b50)fail("invalid_central_entry");
    const flags=view.getUint16(cursor+8,true);
    const method=view.getUint16(cursor+10,true);
    const checksum=view.getUint32(cursor+16,true);
    const compressedSize=view.getUint32(cursor+20,true);
    const uncompressedSize=view.getUint32(cursor+24,true);
    const nameLength=view.getUint16(cursor+28,true);
    const extraLength=view.getUint16(cursor+30,true);
    const entryCommentLength=view.getUint16(cursor+32,true);
    const diskStart=view.getUint16(cursor+34,true);
    const localOffset=view.getUint32(cursor+42,true);
    const centralEntryEnd=cursor+46+nameLength+extraLength+entryCommentLength;
    if(centralEntryEnd>centralOffset+centralSize)fail("invalid_central_entry");
    if((flags&1)!==0||diskStart!==0)fail("unsupported_zip");
    if(method!==0||compressedSize!==uncompressedSize)fail("unsupported_compression");
    if(uncompressedSize>MAX_ENTRY_BYTES)fail("entry_too_large");
    let name;
    try{name=decoder.decode(bytes.subarray(cursor+46,cursor+46+nameLength))}catch{fail("invalid_filename")}
    safeEntryName(name);
    if(entries.has(name))fail("duplicate_entry");

    if(localOffset+30>centralOffset||view.getUint32(localOffset,true)!==0x04034b50)fail("invalid_local_entry");
    const localFlags=view.getUint16(localOffset+6,true);
    const localMethod=view.getUint16(localOffset+8,true);
    const localNameLength=view.getUint16(localOffset+26,true);
    const localExtraLength=view.getUint16(localOffset+28,true);
    if((localFlags&1)!==0||localMethod!==0)fail("unsupported_zip");
    const dataStart=localOffset+30+localNameLength+localExtraLength;
    const dataEnd=dataStart+compressedSize;
    if(dataEnd>centralOffset)fail("invalid_local_entry");
    let localName;
    try{localName=decoder.decode(bytes.subarray(localOffset+30,localOffset+30+localNameLength))}catch{fail("invalid_filename")}
    if(localName!==name)fail("filename_mismatch");
    const data=bytes.slice(dataStart,dataEnd);
    if(crc32(data)!==checksum)fail("crc_mismatch");

    totalData+=data.length;
    if(totalData>MAX_ARCHIVE_BYTES)fail("archive_too_large");
    if(!name.endsWith("/"))entries.set(name,data);
    cursor=centralEntryEnd;
  }
  if(cursor!==centralOffset+centralSize)fail("invalid_central_directory");
  return entries;
}
function readText(entries,name,maxBytes=MAX_ENTRY_BYTES){
  if(!(entries instanceof Map)||!entries.has(name))fail("missing_entry");
  const bytes=entries.get(name);
  if(bytes.length>maxBytes)fail("entry_too_large");
  let value;
  try{value=decoder.decode(bytes)}catch{fail("invalid_text")}
  return value.replace(/^\uFEFF/,"");
}
function readJson(entries,name,maxBytes=MAX_ENTRY_BYTES){
  try{return JSON.parse(readText(entries,name,maxBytes))}
  catch(error){
    if(error?.code)throw error;
    fail("invalid_json");
  }
}
function download(blob,filename){
  if(!(blob instanceof Blob)||typeof filename!=="string"||!filename)fail("invalid_download");
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;
  link.download=filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
}
window.MawaeidiBackup=Object.freeze({
  createZip,
  readZip,
  readText,
  readJson,
  download,
  crc32,
  safeEntryName,
  limits:Object.freeze({maxArchiveBytes:MAX_ARCHIVE_BYTES,maxEntryBytes:MAX_ENTRY_BYTES,maxFiles:MAX_FILES})
});
})();
