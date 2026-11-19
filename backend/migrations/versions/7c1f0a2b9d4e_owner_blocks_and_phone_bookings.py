"""owner blocks and phone bookings

Revision ID: 7c1f0a2b9d4e
Revises: 35e4d32230b8
Create Date: 2026-11-19 00:00:00

"""
from alembic import op
import sqlalchemy as sa


revision = '7c1f0a2b9d4e'
down_revision = '35e4d32230b8'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('bookings', schema=None) as batch_op:
        batch_op.add_column(sa.Column('kind', sa.String(length=10), server_default='guest', nullable=False))
        batch_op.add_column(sa.Column('encrypted_note', sa.Text(), nullable=True))
        batch_op.alter_column('customer_id', existing_type=sa.Integer(), nullable=True)
        batch_op.create_check_constraint('bookings_kind_valid', "kind IN ('guest','phone','block')")
        batch_op.create_check_constraint(
            'bookings_customer_unless_block', "kind = 'block' OR customer_id IS NOT NULL"
        )
    with op.batch_alter_table('customers', schema=None) as batch_op:
        batch_op.alter_column('encrypted_email', existing_type=sa.Text(), nullable=True)


def downgrade():
    op.execute("DELETE FROM bookings WHERE kind = 'block'")
    op.execute("UPDATE customers SET encrypted_email = '' WHERE encrypted_email IS NULL")
    with op.batch_alter_table('customers', schema=None) as batch_op:
        batch_op.alter_column('encrypted_email', existing_type=sa.Text(), nullable=False)
    with op.batch_alter_table('bookings', schema=None) as batch_op:
        batch_op.drop_constraint('bookings_customer_unless_block', type_='check')
        batch_op.drop_constraint('bookings_kind_valid', type_='check')
        batch_op.alter_column('customer_id', existing_type=sa.Integer(), nullable=False)
        batch_op.drop_column('encrypted_note')
        batch_op.drop_column('kind')
