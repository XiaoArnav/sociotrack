"""
Workspace, Team Collaboration, RBAC, API Keys, and Audit Log Models.
Provides strict multi-tenancy isolation and team access control.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


class Workspace(Base):
    """
    Top-level organizational tenant encapsulating multiple brands,
    team members, API keys, and audit logs.
    """
    __tablename__ = "workspaces"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    owner_id = Column(String(36), nullable=False, index=True)
    plan = Column(String(50), default="enterprise_scale")
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    members = relationship("WorkspaceMember", back_populates="workspace", cascade="all, delete-orphan")
    invites = relationship("WorkspaceInvite", back_populates="workspace", cascade="all, delete-orphan")
    api_keys = relationship("ApiKey", back_populates="workspace", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="workspace", cascade="all, delete-orphan")


class WorkspaceMember(Base):
    """
    Role-Based Access Control (RBAC) linking users to workspaces.
    Supported roles: 'owner', 'admin', 'editor', 'viewer'.
    """
    __tablename__ = "workspace_members"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False, default="editor")  # owner, admin, editor, viewer
    joined_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    workspace = relationship("Workspace", back_populates="members")
    user = relationship("User")

    __table_args__ = (
        Index("idx_workspace_user_unique", "workspace_id", "user_id", unique=True),
    )


class WorkspaceInvite(Base):
    """
    Pending or accepted invitations for team members to join a workspace.
    """
    __tablename__ = "workspace_invites"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    role = Column(String(50), nullable=False, default="editor")
    token = Column(String(64), nullable=False, unique=True, index=True)
    invited_by = Column(String(36), nullable=False)
    status = Column(String(50), nullable=False, default="pending")  # pending, accepted, revoked, expired
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    workspace = relationship("Workspace", back_populates="invites")


class ApiKey(Base):
    """
    Programmatic scoped API keys for developer integration (e.g. st_live_...).
    Stores SHA-256 hashed keys to protect credentials at rest.
    """
    __tablename__ = "api_keys"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    key_prefix = Column(String(16), nullable=False)  # First 8-12 chars (e.g., "st_live_a1b2")
    hashed_key = Column(String(64), nullable=False, index=True)  # SHA-256 hex digest
    scopes = Column(Text, nullable=False, default="read:analytics,write:content")  # Comma-delimited scopes
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    workspace = relationship("Workspace", back_populates="api_keys")
    user = relationship("User")


class AuditLog(Base):
    """
    Immutable audit trail recording administrative and sensitive user actions.
    """
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), nullable=True, index=True)
    action = Column(String(100), nullable=False)  # e.g., "member.invited", "brand.created", "api_key.revoked"
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(36), nullable=True)
    metadata_json = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    workspace = relationship("Workspace", back_populates="audit_logs")
