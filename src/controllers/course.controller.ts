import { Request, Response } from 'express';
import { CourseModel } from '../models/course.model';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../utils/async-handler';
import apiResponse from '../utils/api-response';
import { uploadOnCloudinary } from '../utils/cloudinary';
import { AuthenticatedRequest, getAuth } from '../utils/get-auth';
import mongoose from 'mongoose';
import fs from 'fs';
import { ErrorCodes, HttpStatusCodes } from '../config/status-codes';

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
      const courses = await CourseModel.find(categoryFilter)
        .skip(skip)
        .limit(pageSize);
      // .sort(sortCriteria);

      // Get total number of courses for pagination metadata
      const totalCourses = await CourseModel.countDocuments(categoryFilter);

      // Calculate total pages for pagination
      const totalPages = Math.ceil(totalCourses / pageSize);

      // Return API response with pagination metadata
      return apiResponse(res, {
        success: true,
        message: 'Courses retrieved successfully',
        data: {
          courses,
          totalCourses,
          totalPages,
          currentPage: pageNumber,
          pageSize,
        },
        statusCode: HttpStatusCodes.OK,
      });
    } catch (error) {
      // Handle unexpected errors gracefully
      console.error('Error retrieving courses:', error);
      return apiResponse(res, {
        success: false,
        message: 'Failed to retrieve courses',
        statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }
);

export const getCourse = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { courseId } = req.params;

    // Validate the courseId format (ensure it's a valid ObjectId if you're using MongoDB)
    if (!courseId.match(/^[0-9a-fA-F]{24}$/)) {
      return apiResponse(res, {
        success: false,
        message: 'Invalid course ID format',
        statusCode: HttpStatusCodes.BAD_REQUEST,
      });
    }

    try {
      // Fetch the course from the database with necessary population (if needed)
      const course = await CourseModel.findById(courseId)
        .populate('sections')
        .populate('teacherId');

      // Check if the course was found
      if (!course) {
        return apiResponse(res, {
          success: false,
          message: 'Course not found',
          statusCode: HttpStatusCodes.NOT_FOUND,
        });
      }

      // Return the course data in the API response
      return apiResponse(res, {
        success: true,
        message: 'Course retrieved successfully',
        data: course,
        statusCode: HttpStatusCodes.OK,
      });
    } catch (error) {
      // Log the error for debugging
      console.error('Error fetching course:', error);

      // Send a generic error response
      return apiResponse(res, {
        success: false,
        message: 'An error occured while fetching the course',
        statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      });
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
      return apiResponse(res, {
        success: false,
        message: 'Teacher ID, Teacher name, Title, and Category are required',
        statusCode: HttpStatusCodes.BAD_REQUEST,
      });
    }

    // Validate that the teacherId is a valid ObjectId if it's from MongoDB
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return apiResponse(res, {
        success: false,
        message: 'Invalid Teacher id',
        statusCode: HttpStatusCodes.BAD_REQUEST,
        error: ErrorCodes.BAD_REQUEST,
      });
    }

    // Handle image upload if provided
    let imageUrl = '';
    if (image) {
      try {
        const uploadResult = await uploadOnCloudinary(image);
        imageUrl = uploadResult?.secure_url!; // Assuming the result contains a secure_url field
      } catch (error) {
        return apiResponse(res, {
          success: false,
          message: 'Error uploading image to cloudinary',
          statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
        });
      }
    }

    // Create a new course instance
    const newCourse = new CourseModel({
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
      return apiResponse(res, {
        success: true,
        message: 'Course created successfully',
        data: newCourse,
        statusCode: HttpStatusCodes.CREATED,
      });
    } catch (error) {
      // Log the error and respond with an error message
      console.error('Error creating course:', error);
      return apiResponse(res, {
        success: false,
        message: 'Error creating course',
        statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }
);

export const updateCourse = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { courseId } = req.params;
    const updateData = { ...req.body };
    const { userId } = getAuth(req as AuthenticatedRequest); // Get authenticated user's ID

    // Find the course by courseId
    const course = await CourseModel.findOne({ courseId });
    if (!course) {
      return apiResponse(res, {
        success: false,
        message: 'Course not found',
        statusCode: HttpStatusCodes.NOT_FOUND,
      });
    }

    // Check authorization: Ensure the logged-in user is the course owner (teacher)
    if (course.teacherId !== userId) {
      return apiResponse(res, {
        success: false,
        message: 'Not authorized to update this course',
        statusCode: HttpStatusCodes.FORBIDDEN,
      });
    }

    // Validate and process price
    if (updateData.price) {
      const price = parseInt(updateData.price, 10);
      if (isNaN(price)) {
        return apiResponse(res, {
          success: false,
          message: 'Invalid price format. Price must be a valid number',
          statusCode: HttpStatusCodes.BAD_REQUEST,
        });
      }
      updateData.price = price * 100; // Convert price to cents (or paise)
    }

    // Handle image update if a new image URL is provided
    if (updateData.image) {
      try {
        const uploadResult = await uploadOnCloudinary(updateData.image);
        updateData.image = uploadResult?.secure_url; // Get the secure URL of the uploaded image
      } catch (error) {
        return apiResponse(res, {
          success: false,
          message: 'Error uploading image to cloudinary',
          statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
        });
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
    return apiResponse(res, {
      success: true,
      message: 'Course updated successfully',
      data: course,
      statusCode: HttpStatusCodes.OK,
    });
  }
);

export const deleteCourse = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { courseId } = req.params; // Extract courseId from URL params
    const { userId } = getAuth(req as AuthenticatedRequest); // Get authenticated user's ID

    // Find the course by its courseId
    const course = await CourseModel.findOne({ courseId });
    if (!course) {
      return apiResponse(res, {
        success: false,
        message: 'Course not found',
        statusCode: HttpStatusCodes.NOT_FOUND,
      });
    }

    // Check if the logged-in user is the teacher for this course
    if (course.teacherId !== userId) {
      return apiResponse(res, {
        success: false,
        message: 'Not authorized to delete this course',
        statusCode: HttpStatusCodes.FORBIDDEN,
      });
    }

    // Delete the course from the database
    await CourseModel.findOneAndDelete({ courseId });

    // Respond with success message
    return apiResponse(res, {
      success: true,
      message: 'Course deleted successfully',
      statusCode: HttpStatusCodes.OK,
    });
    // return apiResponse(res, true, 'Course deleted successfully', course);
  }
);

export const uploadVideo = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { file } = req as Request & { file: Express.Multer.File };

    // Check if a file is provided
    if (!file) {
      return apiResponse(res, {
        success: false,
        message: 'No video file provided',
        statusCode: HttpStatusCodes.BAD_REQUEST,
      });
    }

    // Validate that the file is a video
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv']; // List supported video formats
    if (!allowedTypes.includes(file.mimetype)) {
      return apiResponse(res, {
        success: false,
        message: 'Invalid video format. Allowed formats are MP4, AVI, MOV, MKV',
        statusCode: HttpStatusCodes.BAD_REQUEST,
      });
    }

    // Validate file size (max 500MB, for example)
    const maxSize = 500 * 1024 * 1024; // 500 MB
    if (file.size > maxSize) {
      return apiResponse(res, {
        success: false,
        message: 'Video file is too large. Maximum size is 500MB',
        statusCode: HttpStatusCodes.BAD_REQUEST,
      });
    }

    try {
      // Check if the file path exists before uploading
      if (!fs.existsSync(file.path)) {
        return apiResponse(res, {
          success: false,
          message: 'File path does not exists',
          statusCode: HttpStatusCodes.BAD_REQUEST,
        });
      }

      // Upload the video to Cloudinary
      const response = await uploadOnCloudinary(file.path);

      // If the upload fails
      if (!response) {
        return apiResponse(res, {
          success: false,
          message: 'Error uploading video to cloudinary',
          statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
        });
      }

      // Return the response data
      return apiResponse(res, {
        success: true,
        message: 'Video uploaded successfully',
        data: {
          publicId: response.public_id,
          secureUrl: response.secure_url,
          format: response.format,
          duration: response.duration,
          resourceType: response.resource_type,
        },
        statusCode: HttpStatusCodes.OK,
      });
    } catch (error) {
      return apiResponse(res, {
        success: false,
        message: 'Error uploading video',
        statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }
);
