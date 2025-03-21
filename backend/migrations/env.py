import logging
from logging.config import fileConfig

from flask import current_app
from alembic import context

# Alembic Config object for access to .ini file values
config = context.config

# Configure logging
fileConfig(config.config_file_name)
logger = logging.getLogger('alembic.env')

def get_engine():
    """Retrieve the SQLAlchemy engine from Flask-Migrate."""
    try:
        return current_app.extensions['migrate'].db.get_engine()
    except (TypeError, AttributeError, KeyError):
        logger.error("Flask-Migrate extension is missing or incorrectly configured.")
        raise

def get_engine_url():
    """Retrieve the database URL from the engine."""
    try:
        return get_engine().url.render_as_string(hide_password=False).replace('%', '%%')
    except AttributeError:
        return str(get_engine().url).replace('%', '%%')

# Set the database URL for Alembic
config.set_main_option('sqlalchemy.url', get_engine_url())

# Get the target database metadata
target_db = current_app.extensions['migrate'].db
if not target_db:
    logger.error("Flask-Migrate database extension is missing.")
    raise RuntimeError("Flask-Migrate is not initialized properly.")

def get_metadata():
    """Retrieve metadata from the database."""
    return target_db.metadatas.get(None, target_db.metadata)

def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=get_metadata(), literal_binds=True)

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    """Run migrations in 'online' mode."""
    def process_revision_directives(context, revision, directives):
        if getattr(config.cmd_opts, 'autogenerate', False):
            script = directives[0]
            if script.upgrade_ops.is_empty():
                directives[:] = []
                logger.info('No schema changes detected.')

    conf_args = current_app.extensions['migrate'].configure_args
    conf_args.setdefault("process_revision_directives", process_revision_directives)

    connectable = get_engine()

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=get_metadata(), **conf_args)

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
