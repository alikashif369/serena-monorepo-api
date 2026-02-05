import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class AcceptInvitationDto {
  @ApiProperty({
    description: 'The invitation token from the email link',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the new admin',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Password for the new account (min 8 characters, must include uppercase, lowercase, number, and special character)',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-\[\]{}|;:',.<>\/~`])[A-Za-z\d@$!%*?&#^()_+=\-\[\]{}|;:',.<>\/~`]{8,}$/,
    {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  @IsNotEmpty()
  password: string;
}
