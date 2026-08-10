import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password!: string;

  @IsString()
  @IsNotEmpty()
  namaLengkap!: string;

  @IsEnum(Role)
  role!: Role;

  @IsString()
  @IsNotEmpty()
  kotamaId!: string;

  @IsString()
  @IsNotEmpty()
  satminkalId!: string;
}
