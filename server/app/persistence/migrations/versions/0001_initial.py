from __future__ import annotations

from alembic import op
import sqlalchemy as sa
import uuid

revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'portfolios',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        'holdings',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('portfolio_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('portfolios.id', ondelete='CASCADE'), nullable=False),
        sa.Column('symbol', sa.String(length=16), nullable=False),
        sa.Column('quantity', sa.Numeric(18, 8), nullable=False),
        sa.Column('average_cost', sa.Numeric(18, 6), nullable=False),
        sa.Column('first_purchase_date', sa.Date(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('portfolio_id', 'symbol', name='uq_portfolio_symbol'),
    )
    op.create_index('ix_holdings_portfolio_id', 'holdings', ['portfolio_id'])


def downgrade():
    op.drop_index('ix_holdings_portfolio_id', table_name='holdings')
    op.drop_table('holdings')
    op.drop_table('portfolios')
