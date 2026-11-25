"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"../student-registry.js"),"utf8");
const start=source.indexOf("function setAvatarContent("),end=source.indexOf("\n}",start)+2;
assert.ok(start>=0&&end>start);
function node(tag){
  return {tag,parentNode:null,children:[],append(child){child.parentNode=this;this.children.push(child)},replaceChildren(...children){for(const child of this.children)child.parentNode=null;this.children=[];for(const child of children)this.append(child)},addEventListener(name,fn){this[name]=fn}};
}
const document={createElement:node};
const avatar=new Function("document","safePhotoUrl","studentInitials",source.slice(start,end)+"\nreturn setAvatarContent")(document,x=>x||"",s=>s.first_name[0]);
const holder=node("span"),student={first_name:"Ali",photo_url:"https://example.test/photo"};
avatar(holder,student,student.photo_url,{lazy:true});
const old=holder.children[0];assert.equal(old.loading,"lazy");assert.equal(old.decoding,"async");assert.equal(old.src,student.photo_url);
avatar(holder,{first_name:"Sara",photo_url:"https://example.test/other"});
const fresh=holder.children[0];assert.equal(fresh.loading,undefined);old.error();assert.equal(holder.children[0],fresh,"Old image failure must not overwrite a newer avatar");
fresh.error();assert.equal(holder.children[0].textContent,"S");
avatar(holder,{first_name:"Ali"});assert.equal(holder.children[0].textContent,"A");
assert.match(source,/setAvatarContent\(avatar,student,student\.photo_url,\{lazy:true\}\)/);
console.log("Student avatar lazy loading, profile loading and stale error protection passed.");
