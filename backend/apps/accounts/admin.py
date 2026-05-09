from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'full_name', 'role', 'status', 'is_staff', 'created_at') # type: ignore
    list_filter = ('role', 'status', 'is_staff', 'is_active') # type: ignore
    search_fields = ('email', 'full_name') # type: ignore
    ordering = ('-created_at',) # type: ignore
    
    fieldsets = ( # type: ignore
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('full_name', 'phone')}),
        ('Role and Status', {'fields': ('role', 'status')}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Important dates', {'fields': ('last_login',)}),
    )
    add_fieldsets = ( # type: ignore
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password', 'full_name', 'role', 'status', 'is_staff', 'is_superuser'),
        }),
    )
