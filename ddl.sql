CREATE TABLE public.users (
	id uuid default gen_random_uuid() NOT NULL,
	email varchar NULL,
	created_at timestamp DEFAULT clock_timestamp() NOT NULL,
	updated_at timestamp DEFAULT clock_timestamp() NOT NULL,
	CONSTRAINT users_pk PRIMARY KEY (id)
);

CREATE TABLE public.credentials (
	id text NULL,
	public_key bytea NULL,
	user_id uuid NULL,
	webauthn_user_id text NULL,
	counter bigint NULL,
	device_type varchar NULL,
	backed_up bool NULL,
	transports varchar NULL,
	created_at timestamp DEFAULT clock_timestamp() NOT NULL,
	last_used timestamp DEFAULT clock_timestamp() NOT NULL
);

CREATE INDEX credentials_id_idx ON public.credentials (id);
