import { Request, Response } from 'express';
import { Course } from '../models/course.model';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../utils/async-handler';
import apiResponse from '../utils/api-response';
import { uploadOnCloudinary } from '../utils/cloudinary';
import { AuthenticatedRequest, getAuth } from '../utils/get-auth';
import mongoose from 'mongoose';
import fs from 'fs';

// // Function to list courses with optional category filter, pagination, and sorting
export const getCourses = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const {
      category,
      page = 1,
      limit = 10,
      // sortBy = 'createdAt',
      // sortOrder = 'desc',
    } = req.query;

    // Validate category if provided
    const validCategories = ['all', 'Beginner', 'Intermediate', 'Advanced'];
    const categoryFilter =
      category && validCategories.includes(category as string)
        ? { category }
        : category && category !== 'all'
          ? { category: { $regex: category, $options: 'i' } } // Case-insensitive regex match for flexibility
          : {};

    // Build pagination and sorting parameters
    const pageNumber = parseInt(page as string, 10);
    const pageSize = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * pageSize;
    // const sortCriteria = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    try {
      // Fetch courses from the database with pagination, category filter, and sorting
      const courses = await Course.find(categoryFilter)
        .skip(skip)
        .limit(pageSize);
      // .sort(sortCriteria);

      // Get total number of courses for pagination metadata
      const totalCourses = await Course.countDocuments(categoryFilter);

      // Calculate total pages for pagination
      const totalPages = Math.ceil(totalCourses / pageSize);

      // Return API response with pagination metadata
      return apiResponse(
        res,
        true,
        'Courses retrieved successfully',
        {
          courses,
          totalCourses,
          totalPages,
          currentPage: pageNumber,
          pageSize,
        },
        200
      );
    } catch (error) {
      // Handle unexpected errors gracefully
      console.error('Error retrieving courses:', error);
      return apiResponse(res, false, 'Failed to retrieve courses', null, 500);
    }
  }
);

export const getCourse = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { courseId } = req.params;

    // Validate the courseId format (ensure it's a valid ObjectId if you're using MongoDB)
    if (!courseId.match(/^[0-9a-fA-F]{24}$/)) {
      return apiResponse(res, false, 'Invalid course ID format', null, 400);
    }

    try {
      // Fetch the course from the database with necessary population (if needed)
      const course = await Course.findById(courseId)
        .populate('sections')
        .populate('teacherId');

      // Check if the course was found
      if (!course) {
        return apiResponse(res, false, 'Course not found', null, 404);
      }

      // Return the course data in the API response
      return apiResponse(
        res,
        true,
        'Course retrieved successfully',
        course,
        200
      );
    } catch (error) {
      // Log the error for debugging
      console.error('Error fetching course:', error);

      // Send a generic error response
      return apiResponse(
        res,
        false,
        'An error occurred while fetching the course',
        null,
        500
      );
    }
  }
);

export const createCourse = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const {
      teacherId,
      teacherName,
      title,
      description,
      category,
      price,
      level,
      status,
      image,
    } = req.body;

    // Validate required fields
    if (!teacherId || !teacherName || !title || !category) {
      return apiResponse(
        res,
        false,
        'Teacher Id, Teacher Name, Title, and Category are required',
        null,
        400
      );
    }

    // Validate that the teacherId is a valid ObjectId if it's from MongoDB
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return apiResponse(res, false, 'Invalid Teacher ID', null, 400);
    }

    // Handle image upload if provided
    let imageUrl = '';
    if (image) {
      try {
        const uploadResult = await uploadOnCloudinary(image);
        imageUrl = uploadResult?.secure_url!; // Assuming the result contains a secure_url field
      } catch (error) {
        return apiResponse(
          res,
          false,
          'Error uploading image to Cloudinary',
          null,
          500
        );
      }
    }

    // Create a new course instance
    const newCourse = new Course({
      courseId: uuidv4(), // Generate a unique course ID
      teacherId,
      teacherName,
      title: title || 'Untitled Course', // Default title if not provided
      description: description || '', // Default empty description if not provided
      category: category || 'Uncategorized', // Default to 'Uncategorized'
      image: imageUrl, // Save the image URL from Cloudinary (if uploaded)
      price: price || 0, // Default price if not provided
      level: level || 'Beginner', // Default to 'Beginner' if not provided
      status: status || 'Draft', // Default to 'Draft' status
      sections: [], // Empty array for sections by default
      enrollments: [], // Empty array for enrollments by default
    });

    try {
      // Save the course to the database
      await newCourse.save();

      // Respond with success message and the newly created course
      return apiResponse(
        res,
        true,
        'Course created successfully',
        newCourse,
        201
      );
    } catch (error) {
      // Log the error and respond with an error message
      console.error('Error creating course:', error);
      return apiResponse(res, false, 'Error creating course', null, 500);
    }
  }
);

export const updateCourse = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { courseId } = req.params;
    const updateData = { ...req.body };
    const { userId } = getAuth(req as AuthenticatedRequest); // Get authenticated user's ID

    // Find the course by courseId
    const course = await Course.findOne({ courseId });
    if (!course) {
      return apiResponse(res, false, 'Course not found', null, 404);
    }

    // Check authorization: Ensure the logged-in user is the course owner (teacher)
    if (course.teacherId !== userId) {
      return apiResponse(
        res,
        false,
        'Not authorized to update this course',
        null,
        403
      );
    }

    // Validate and process price
    if (updateData.price) {
      const price = parseInt(updateData.price, 10);
      if (isNaN(price)) {
        return apiResponse(
          res,
          false,
          'Invalid price format. Price must be a valid number.',
          null,
          400
        );
      }
      updateData.price = price * 100; // Convert price to cents (or paise)
    }

    // Handle image update if a new image URL is provided
    if (updateData.image) {
      try {
        const uploadResult = await uploadOnCloudinary(updateData.image);
        updateData.image = uploadResult?.secure_url; // Get the secure URL of the uploaded image
      } catch (error) {
        return apiResponse(
          res,
          false,
          'Error uploading image to Cloudinary',
          null,
          500
        );
      }
    }

    // Validate and process sections and chapters
    if (updateData.sections) {
      const sectionsData = Array.isArray(updateData.sections)
        ? updateData.sections
        : JSON.parse(updateData.sections);

      updateData.sections = sectionsData.map((section: any) => {
        if (!section.sectionId) {
          section.sectionId = uuidv4(); // Generate sectionId if missing
        }

        section.chapters = section.chapters.map((chapter: any) => {
          if (!chapter.chapterId) {
            chapter.chapterId = uuidv4(); // Generate chapterId if missing
          }
          return chapter;
        });

        return section;
      });
    }

    // Update the course with the new data
    Object.assign(course, updateData);
    await course.save();

    // Send a response with the updated course
    return apiResponse(res, true, 'Course updated successfully', course, 200);
  }
);

export const deleteCourse = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { courseId } = req.params; // Extract courseId from URL params
    const { userId } = getAuth(req as AuthenticatedRequest); // Get authenticated user's ID

    // Find the course by its courseId
    const course = await Course.findOne({ courseId });
    if (!course) {
      return apiResponse(res, false, 'Course not found', null, 404);
    }

    // Check if the logged-in user is the teacher for this course
    if (course.teacherId !== userId) {
      return apiResponse(
        res,
        false,
        'Not authorized to delete this course',
        null,
        403
      );
    }

    // Delete the course from the database
    await Course.findOneAndDelete({ courseId });

    // Respond with success message
    return apiResponse(res, true, 'Course deleted successfully', course);
  }
);

export const uploadVideo = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { file } = req as Request & { file: Express.Multer.File };

    // Check if a file is provided
    if (!file) {
      return apiResponse(res, false, 'No video file provided', null, 400);
    }

    // Validate that the file is a video
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv']; // List supported video formats
    if (!allowedTypes.includes(file.mimetype)) {
      return apiResponse(
        res,
        false,
        'Invalid video format. Allowed formats are MP4, AVI, MOV, MKV.',
        null,
        400
      );
    }

    // Validate file size (max 500MB, for example)
    const maxSize = 500 * 1024 * 1024; // 500 MB
    if (file.size > maxSize) {
      return apiResponse(
        res,
        false,
        'Video file is too large. Maximum size is 500MB.',
        null,
        400
      );
    }

    try {
      // Check if the file path exists before uploading
      if (!fs.existsSync(file.path)) {
        return apiResponse(res, false, 'File path does not exist', null, 400);
      }

      // Upload the video to Cloudinary
      const response = await uploadOnCloudinary(file.path);

      // If the upload fails
      if (!response) {
        return apiResponse(
          res,
          false,
          'Error uploading video to Cloudinary',
          null,
          500
        );
      }

      // Return the response data
      return apiResponse(res, true, 'Video uploaded successfully', {
        publicId: response.public_id,
        secureUrl: response.secure_url,
        format: response.format,
        duration: response.duration,
        resourceType: response.resource_type,
      });
    } catch (error) {
      // Detailed error logging
      console.error('Error in uploadVideo controller:', error);

      return apiResponse(res, false, 'Error uploading video', error, 500);
    }
  }
);
