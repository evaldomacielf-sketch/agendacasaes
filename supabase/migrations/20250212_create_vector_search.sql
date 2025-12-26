-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Add description and embedding columns to the services table
alter table services 
add column if not exists description text,
add column if not exists embedding vector(384); -- Using 384 dimensions (common for efficient models)

-- Create a function to search for services by similarity
create or replace function match_services (
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  name text,
  description text,
  price float,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    services.id,
    services.name,
    services.description,
    services.price,
    1 - (services.embedding <=> query_embedding) as similarity
  from services
  where 1 - (services.embedding <=> query_embedding) > match_threshold
  order by services.embedding <=> query_embedding
  limit match_count;
end;
$$;
