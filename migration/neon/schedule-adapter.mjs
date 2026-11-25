// Preserve the existing table name and schedule JSON structure.
// RLS, not the browser filter, is the authorization boundary.
export function createScheduleAdapter(client) {
  async function owner() {
    const {data,error} = await client.auth.getUser();
    if (error || !data?.user?.id) throw new Error('authentication_required');
    return data.user.id;
  }
  return {
    async load() {
      const id = await owner();
      const {data,error} = await client.from('mawaeidi_data')
        .select('lessons,updated_at').eq('user_id',id).maybeSingle();
      if (error) throw new Error('schedule_load_failed');
      if (data === null) return null;
      if (!Array.isArray(data?.lessons)) throw new Error('invalid_schedule');
      return data;
    },
    async save(lessons) {
      if (!Array.isArray(lessons)) throw new TypeError('invalid_schedule');
      const id = await owner();
      const {data,error} = await client.from('mawaeidi_data').upsert({
        user_id:id, lessons, updated_at:new Date().toISOString()
      },{onConflict:'user_id'}).select('updated_at').single();
      if (error || !data?.updated_at) throw new Error('schedule_save_not_confirmed');
      return data;
    }
  };
}
