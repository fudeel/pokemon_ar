# app/core/exceptions.py


class DomainError(Exception):
    """Base error raised by domain or service code on a business rule violation."""


class NotFoundError(DomainError):
    pass


class AlreadyExistsError(DomainError):
    pass


class AuthenticationError(DomainError):
    pass


class AuthorizationError(DomainError):
    pass


class ValidationError(DomainError):
    pass


class OutOfRangeError(DomainError):
    """Raised when a player attempts an interaction outside the allowed proximity."""


class InsufficientResourcesError(DomainError):
    """Raised when a player does not have enough items, coins, or party space."""
