const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { s3, s3BucketName } = require('../config/aws');
const PDFDocument = require('pdfkit');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // Limit file size to 10MB
    },
    fileFilter: (req, file, callback) => {
        // Accept only pdf, jpg, jpeg, png files
        const allowedFileTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
        const ext = path.extname(file.originalname).toLowerCase();

        if (allowedFileTypes.includes(ext)) {
            return callback(null, true);
        }

        callback(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.'));
    }
});

// Function to upload file to S3
const uploadToS3 = async (file, consultationId, doctorId, patientId) => {
    // Generate unique file name with appropriate path
    const fileExtension = path.extname(file.originalname);
    const key = `prescriptions/${consultationId}/${uuidv4()}${fileExtension}`;

    const params = {
        Bucket: s3BucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
            'consultation-id': consultationId,
            'doctor-id': doctorId,
            'patient-id': patientId
        }
    };

    try {
        const result = await s3.upload(params).promise();
        return {
            success: true,
            fileUrl: result.Location,
            key: result.Key,
            filename: file.originalname,
            fileType: file.mimetype
        };
    } catch (error) {
        console.error('Error uploading file to S3:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Function to generate PDF from custom prescription data
const generatePrescriptionPDF = async (prescriptionData, consultationId, doctorId, patientId) => {
    try {
        // Create a PDF document
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4'
        });

        // Buffer to store PDF
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));

        // Promise to wait for PDF completion
        const pdfPromise = new Promise((resolve, reject) => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
        });

        // Header with logo (if available) or text
        doc.fontSize(22).text('eMediHub', { align: 'center' });
        doc.fontSize(16).text('Digital Prescription', { align: 'center' });
        doc.moveDown();

        // Add horizontal line
        doc.moveTo(50, doc.y)
            .lineTo(doc.page.width - 50, doc.y)
            .stroke();
        doc.moveDown();

        // Doctor and patient information
        doc.fontSize(12);
        doc.font('Helvetica-Bold').text('Doctor: ', { continued: true });
        doc.font('Helvetica').text(prescriptionData.doctorName || 'Doctor');

        doc.font('Helvetica-Bold').text('Patient: ', { continued: true });
        doc.font('Helvetica').text(prescriptionData.patientName || 'Patient');

        doc.font('Helvetica-Bold').text('Date: ', { continued: true });
        doc.font('Helvetica').text(prescriptionData.date || new Date().toISOString().split('T')[0]);

        doc.moveDown();

        // Add horizontal line
        doc.moveTo(50, doc.y)
            .lineTo(doc.page.width - 50, doc.y)
            .stroke();
        doc.moveDown();

        // Prescription heading
        doc.font('Helvetica-Bold').fontSize(14).text('Prescribed Medicines', { underline: true });
        doc.moveDown();

        // Add medicines
        if (prescriptionData.medicines && prescriptionData.medicines.length > 0) {
            prescriptionData.medicines.forEach((medicine, index) => {
                doc.font('Helvetica-Bold').fontSize(12).text(`${index + 1}. ${medicine.name}`);

                if (medicine.dosage) {
                    doc.font('Helvetica').fontSize(10).text(`Dosage: ${medicine.dosage}`);
                }

                if (medicine.frequency) {
                    doc.font('Helvetica').fontSize(10).text(`Frequency: ${medicine.frequency}`);
                }

                if (medicine.duration) {
                    doc.font('Helvetica').fontSize(10).text(`Duration: ${medicine.duration}`);
                }

                if (medicine.notes) {
                    doc.font('Helvetica-Oblique').fontSize(10).text(`Notes: ${medicine.notes}`);
                }

                doc.moveDown();
            });
        } else {
            doc.font('Helvetica').text('No medicines prescribed.');
        }

        // Add instructions if available
        if (prescriptionData.instructions) {
            doc.moveDown();
            doc.font('Helvetica-Bold').fontSize(14).text('General Instructions', { underline: true });
            doc.font('Helvetica').fontSize(11).text(prescriptionData.instructions);
        }

        // Add footer
        doc.moveDown(2);
        const footerY = doc.y;
        doc.fontSize(10).text('This is a digital prescription generated by eMediHub.', 50, footerY);
        doc.text(`Prescription ID: ${consultationId}`, 50, footerY + 15);

        // Doctor's signature placeholder
        doc.text('Doctor\'s Signature:', 350, footerY);
        doc.moveTo(350, footerY + 30)
            .lineTo(500, footerY + 30)
            .stroke();

        // Finalize the PDF and get the buffer
        doc.end();
        const pdfBuffer = await pdfPromise;

        // Upload to S3
        const key = `prescriptions/${consultationId}/${uuidv4()}.pdf`;

        const params = {
            Bucket: s3BucketName,
            Key: key,
            Body: pdfBuffer,
            ContentType: 'application/pdf',
            Metadata: {
                'consultation-id': consultationId,
                'doctor-id': doctorId,
                'patient-id': patientId
            }
        };

        const result = await s3.upload(params).promise();
        return {
            success: true,
            fileUrl: result.Location,
            key: result.Key,
            filename: 'prescription.pdf',
            fileType: 'application/pdf'
        };
    } catch (error) {
        console.error('Error generating and uploading PDF:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Function to delete file from S3
const deleteFromS3 = async (key) => {
    try {
        await s3.deleteObject({
            Bucket: s3BucketName,
            Key: key
        }).promise();

        return {
            success: true
        };
    } catch (error) {
        console.error('Error deleting file from S3:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    upload,
    uploadToS3,
    generatePrescriptionPDF,
    deleteFromS3
}; 