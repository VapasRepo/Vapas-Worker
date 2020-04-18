create table vapas_release
(
	Origin text PRIMARY KEY,
	Label text not null,
	Suite text not null,
	Version text not null,
	Codename text not null,
	Architectures text not null,
	Components text not null,
	Description text not null
)