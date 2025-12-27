-- Enable Vector Extension
create extension if not exists vector;
-- Add Embedding to Services
alter table services
add column if not exists embedding vector(768);
-- standard text-embedding-004 size? or 1536 (openai). 
-- Vertex AI 'text-embedding-004' is 768 dimensions usually.
-- Index for faster search (optional for small data but good practice)
create index on services using ivfflat (embedding vector_cosine_ops) with (lists = 100);
-- Function to match services
create or replace function match_services(
        query_embedding vector(768),
        match_threshold float,
        match_count int,
        p_tenant_id uuid
    ) returns table (
        id uuid,
        name text,
        description text,
        similarity float
    ) language plpgsql stable as $$ begin return query
select services.id,
    services.name,
    services.description,
    1 - (services.embedding <=> query_embedding) as similarity
from services
where 1 - (services.embedding <=> query_embedding) > match_threshold
    and services.tenant_id = p_tenant_id
order by services.embedding <=> query_embedding
limit match_count;
end;
$$;