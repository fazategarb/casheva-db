import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin_disinfolahta',
    description: 'Username akun user/pengurus',
  })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({
    example: 'PasswordSecure123!',
    description: 'Password akun user',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
