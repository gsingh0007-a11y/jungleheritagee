-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store your knowledge base content
create table if not exists knowledge_base (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(768), -- Gemini 1.5 Flash/Pro embedding dimension is usually 768. 
  source_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for security
alter table knowledge_base enable row level security;

-- Allow read access to authenticated users and service role
create policy "Enable read access for all users" on knowledge_base
  for select using (true);

-- Allow write access only to service role (Edge Functions)
create policy "Enable insert for service role" on knowledge_base
  for insert with check (true);
  
create policy "Enable update for service role" on knowledge_base
  for update using (true);

-- Create a function to search for documents
create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query(
    select
      knowledge_base.id,
      knowledge_base.content,
      knowledge_base.metadata,
      1 - (knowledge_base.embedding <=> query_embedding) as similarity
    from knowledge_base
    where 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
    order by knowledge_base.embedding <=> query_embedding
    limit match_count
  );
end;
$$;
