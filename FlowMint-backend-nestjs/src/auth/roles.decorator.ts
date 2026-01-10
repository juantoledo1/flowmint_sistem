import { SetMetadata } from '@nestjs/common';
import { RolNombre } from 'src/roles/entities/rol-nombre.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RolNombre[]) => SetMetadata(ROLES_KEY, roles);
