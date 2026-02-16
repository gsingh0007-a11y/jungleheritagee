-- Update the dimension of the embedding column
alter table knowledge_base alter column embedding type vector(3072);

-- Update the match_documents function to use the new dimension
create or replace function match_documents (
  query_embedding vector(3072),
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
