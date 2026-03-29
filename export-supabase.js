const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://wzrchabbfidxlcdsubtq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cmNoYWJiZmlkeGxjZHN1YnRxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUyNjc4NCwiZXhwIjoyMDg1MTAyNzg0fQ.jKucvBVH1EP3wL7aumgiMFF4-HteRl_fL3yLzn4wcsA'
);

const tables = [
  'users', 'boats', 'log_types', 'log_entries', 'documents',
  'service_providers', 'alerts', 'boat_access', 'boat_components',
  'boat_gallery', 'boat_users', 'crew_members', 'health_checks',
  'invitations', 'notification_preferences', 'parts',
  'safety_equipment', 'user_consent_history', 'audit_log'
];

async function exportAll() {
  const dump = {};
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        console.log(`⚠️  ${table}: ${error.message}`);
        dump[table] = [];
      } else {
        dump[table] = data || [];
        console.log(`✅ ${table}: ${(data || []).length} rows`);
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
      dump[table] = [];
    }
  }
  
  fs.writeFileSync('/tmp/captainslog-data.json', JSON.stringify(dump, null, 2));
  console.log('\n📦 Saved to /tmp/captainslog-data.json');
  
  const totalRows = Object.values(dump).reduce((sum, rows) => sum + rows.length, 0);
  console.log(`📊 Total: ${totalRows} rows across ${tables.length} tables`);
}

exportAll().catch(console.error);
