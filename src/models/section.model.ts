import { model, Schema } from 'mongoose';
import { chapterSchema } from './chapter.model';
import { Section, Chapter } from '../types';

// Section Schema
export const sectionSchema = new Schema<Section>(
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
        validator: function (v: Chapter[]) {
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

export const SectionModel = model<Section>('Section', sectionSchema);
