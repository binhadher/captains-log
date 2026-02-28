-- Fix documents table RLS policies (missing INSERT/UPDATE/DELETE)
-- The table had RLS enabled but only SELECT policy, causing upload failures

-- Allow users to insert documents for their boats (or orphan documents uploaded by them)
CREATE POLICY "Users can insert documents" ON documents
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND (
      boat_id IS NULL OR
      EXISTS (
        SELECT 1 FROM boats 
        WHERE id = documents.boat_id 
        AND (
          owner_id = auth.uid() OR 
          EXISTS (
            SELECT 1 FROM boat_access 
            WHERE boat_id = boats.id 
            AND user_id = auth.uid() 
            AND permission_level IN ('edit', 'admin') 
            AND revoked_at IS NULL
          )
        )
      )
    )
  );

-- Allow users to update their own documents or documents for boats they have edit access to
CREATE POLICY "Users can update documents" ON documents
  FOR UPDATE USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM boats 
      WHERE id = documents.boat_id 
      AND (
        owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM boat_access 
          WHERE boat_id = boats.id 
          AND user_id = auth.uid() 
          AND permission_level IN ('edit', 'admin') 
          AND revoked_at IS NULL
        )
      )
    )
  );

-- Allow users to delete their own documents or documents for boats they own
CREATE POLICY "Users can delete documents" ON documents
  FOR DELETE USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM boats 
      WHERE id = documents.boat_id 
      AND owner_id = auth.uid()
    )
  );

-- Also update the SELECT policy to include orphan documents (uploaded_by without boat_id)
DROP POLICY IF EXISTS "Users can view documents for accessible boats" ON documents;

CREATE POLICY "Users can view documents" ON documents
  FOR SELECT USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM boats 
      WHERE id = documents.boat_id 
      AND (
        owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM boat_access 
          WHERE boat_id = boats.id 
          AND user_id = auth.uid() 
          AND revoked_at IS NULL
        )
      )
    )
  );
