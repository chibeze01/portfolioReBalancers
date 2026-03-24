from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = '0002_add_target_allocation'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("holdings", sa.Column("target_allocation", sa.Numeric(5, 2), nullable=True))


def downgrade():
    op.drop_column("holdings", "target_allocation")
