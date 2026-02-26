-- Fix job_history INSERT to allow public access (portal operates without auth)
DROP POLICY IF EXISTS "Authenticated can insert job history" ON public.job_history;
CREATE POLICY "Anyone can insert job history" ON public.job_history FOR INSERT WITH CHECK (true);

-- Fix job_checklist policies
DROP POLICY IF EXISTS "Authenticated can insert job checklist" ON public.job_checklist;
DROP POLICY IF EXISTS "Authenticated can update job checklist" ON public.job_checklist;
DROP POLICY IF EXISTS "Authenticated can delete job checklist" ON public.job_checklist;
CREATE POLICY "Anyone can insert job checklist" ON public.job_checklist FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update job checklist" ON public.job_checklist FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete job checklist" ON public.job_checklist FOR DELETE USING (true);

-- Fix job_items policies
DROP POLICY IF EXISTS "Authenticated can insert job items" ON public.job_items;
DROP POLICY IF EXISTS "Authenticated can update job items" ON public.job_items;
DROP POLICY IF EXISTS "Authenticated can delete job items" ON public.job_items;
CREATE POLICY "Anyone can insert job items" ON public.job_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update job items" ON public.job_items FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete job items" ON public.job_items FOR DELETE USING (true);

-- Fix job_materials policies
DROP POLICY IF EXISTS "Authenticated can insert job materials" ON public.job_materials;
DROP POLICY IF EXISTS "Authenticated can update job materials" ON public.job_materials;
DROP POLICY IF EXISTS "Authenticated can delete job materials" ON public.job_materials;
CREATE POLICY "Anyone can insert job materials" ON public.job_materials FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update job materials" ON public.job_materials FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete job materials" ON public.job_materials FOR DELETE USING (true);

-- Fix job_time_entries (likely same pattern)
DROP POLICY IF EXISTS "Authenticated can insert job time entries" ON public.job_time_entries;
DROP POLICY IF EXISTS "Authenticated can update job time entries" ON public.job_time_entries;
DROP POLICY IF EXISTS "Authenticated can delete job time entries" ON public.job_time_entries;
CREATE POLICY "Anyone can insert job time entries" ON public.job_time_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update job time entries" ON public.job_time_entries FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete job time entries" ON public.job_time_entries FOR DELETE USING (true);

-- Fix job_production_flows policies
DROP POLICY IF EXISTS "Authenticated can insert job_production_flows" ON public.job_production_flows;
DROP POLICY IF EXISTS "Authenticated can update job_production_flows" ON public.job_production_flows;
DROP POLICY IF EXISTS "Authenticated can delete job_production_flows" ON public.job_production_flows;
CREATE POLICY "Anyone can insert job_production_flows" ON public.job_production_flows FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update job_production_flows" ON public.job_production_flows FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete job_production_flows" ON public.job_production_flows FOR DELETE USING (true);

-- Fix job_comments policies
DROP POLICY IF EXISTS "Authenticated can insert job_comments" ON public.job_comments;
DROP POLICY IF EXISTS "Authenticated can update job_comments" ON public.job_comments;
DROP POLICY IF EXISTS "Authenticated can delete job_comments" ON public.job_comments;
CREATE POLICY "Anyone can insert job_comments" ON public.job_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update job_comments" ON public.job_comments FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete job_comments" ON public.job_comments FOR DELETE USING (true);

-- Fix job_extensions policies
DROP POLICY IF EXISTS "Authenticated can insert job_extensions" ON public.job_extensions;
DROP POLICY IF EXISTS "Authenticated can update job_extensions" ON public.job_extensions;
DROP POLICY IF EXISTS "Authenticated can delete job_extensions" ON public.job_extensions;
CREATE POLICY "Anyone can insert job_extensions" ON public.job_extensions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update job_extensions" ON public.job_extensions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete job_extensions" ON public.job_extensions FOR DELETE USING (true);

-- Fix job_stage_movements INSERT
DROP POLICY IF EXISTS "Authenticated can insert movements" ON public.job_stage_movements;
CREATE POLICY "Anyone can insert movements" ON public.job_stage_movements FOR INSERT WITH CHECK (true);