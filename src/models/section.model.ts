import { IChapter } from './chapter.model';
import { Schema, model, Document } from 'mongoose';
import { chapterSchema } from './chapter.model';

// Interface for Section
export interface ISection extends Document {
  sectionId: string;
  sectionTitle: string;
  sectionDescription?: string;
  chapters: IChapter[];
}

// Section Schema
const sectionSchema = new Schema<ISection>(
  {
    sectionId: {
      type: String,
      required: true,
      unique: true, // Ensure each section has a unique ID
      trim: true, // Remove extra spaces
      index: true, // Index for faster querying
    },
    sectionTitle: {
      type: String,
      required: true,
      trim: true, // Remove extra spaces from title
    },
    sectionDescription: {
      type: String,
      default: '', // Default to empty string if no description is provided
    },
    chapters: {
      type: [chapterSchema],
      required: true,
      validate: {
        validator: function (v: IChapter[]) {
          return v.length > 0; // Ensure each section has at least one chapter
        },
        message: 'A section must contain at least one chapter.',
      },
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Section Model
const Section = model<ISection>('Section', sectionSchema);

export default Section;
