/* Mawaeidi schedule concurrency guard.
   The database RPC compares the saved JSON snapshot under a row lock.
   No unsafe upsert fallback is allowed if the RPC has not been installed. */
(function(root){
  "use strict";
  const RPC="mawaeidi_save_schedule_if_unchanged";
  const MAX_LESSONS=2000;
  function clone(value){return value===null?null:JSON.parse(JSON.stringify(value))}
  function validateArray(value,label){
    if(!Array.isArray(value)||value.length>MAX_LESSONS)throw new TypeError(label+"_invalid");
    if(value.some(item=>!item||typeof item!=="object"||Array.isArray(item)))throw new TypeError(label+"_invalid");
  }
  async function save(cloud,expectedLessons,nextLessons){
    if(!cloud||typeof cloud.rpc!=="function")throw new TypeError("client_unavailable");
    if(expectedLessons!==null)validateArray(expectedLessons,"expected_lessons");
    validateArray(nextLessons,"next_lessons");
    const {data,error}=await cloud.rpc(RPC,{
      p_expected_lessons:clone(expectedLessons),
      p_lessons:clone(nextLessons)
    });
    if(error)throw error;
    if(!data||typeof data!=="object"||!["saved","conflict"].includes(data.status))
      throw new Error("invalid_schedule_save_response");
    if(data.status==="saved"){
      if(typeof data.updated_at!=="string"||!data.updated_at)throw new Error("invalid_schedule_save_timestamp");
      return {status:"saved",updatedAt:data.updated_at};
    }
    if(!Array.isArray(data.current_lessons)&&data.current_lessons!==null)
      throw new Error("invalid_schedule_conflict_response");
    return {status:"conflict",currentLessons:clone(data.current_lessons),updatedAt:data.updated_at||null};
  }
  root.MawaeidiScheduleSync=Object.freeze({save,RPC});
})(window);
