import { IsString, MaxLength } from 'class-validator';

export class AddInquiryNoteDto {
  @IsString()
  @MaxLength(2000)
  note!: string;
}
