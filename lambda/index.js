// const {DynamoDBClient, PutItemCommand} = require('@aws-sdk/client-dynamodb');

// const STUDENT_TABLE = process.env.STUDENT_TABLE;
// const AUDIT_QUEUE_URL = process.env.AUDIT_QUEUE_URL;

// const client =new DynamoDBClient();

// exports.handler = async function(event) {
//     const httpMethod = event.httpMethod;
//     // const studentId = event.pathParameters ? event.pathParameters.studentId : null;
//     // const body = JSON.parse(event.body);

//     switch (httpMethod) {
//         case 'POST':
//             return createStudent(event);
//         case 'GET':
//             return getStudent(studentId);
//         case 'PUT':
//             return updateStudent(studentId, body);
//         case 'DELETE':
//             return deleteStudent(studentId);
//         default:
//             return { statusCode: 400, body: 'Unsupported method' };
//     }
// };

// // Create Student
// // async function createStudent(student) {
// //     const params = {
// //         TableName: STUDENT_TABLE,
// //         Item: student
// //     };

// //     await dynamodb.put(params).promise();
// //     await sendAuditEvent('CREATE', student);

// //     return { statusCode: 201, body: JSON.stringify(student) };
// // }
// async function createStudent(event) {

//     // return {
//     //     statusCode:200,
//     //     body:JSON.stringify( {
//     //         message:"create api"
//     //     })
//     // }
//     const { studentId, name, age, className } = JSON.parse(event.body);
 
//   const params = {
//     TableName: "StudentTable"||process.env.TABLE_NAME,
//     Item: {
//       studentId: { S: studentId },
//       name: { S: name },
//       age: { N: age.toString() },
//       className: { S: className },
//     },
//   };

//     try {
        
//         // Validate student object (optional)
//         // if (!student || !student.id || !student.name) {
//         //     return { statusCode: 400, body: JSON.stringify({ message: 'Invalid student data' }) };
//         // }

//         // Insert student record into DynamoDB
//         await client.send(new PutItemCommand(params));

//         // Send audit event for student creation
//         // await sendAuditEvent('CREATE', student);

//         // Return success response
//         return { statusCode: 201, 
//             body: JSON.stringify({ message: 'Student created successfully', 
//                    }) };

//     } catch (error) {
//         console.error('Error creating student:', error);

//         // Handle specific DynamoDB errors if needed
//         return { statusCode: 500, body: JSON.stringify({ message: 'Failed to create student', error: error.message }) };
//     }
// }



const { DynamoDBClient, PutItemCommand, GetItemCommand, DeleteItemCommand, UpdateItemCommand,ScanCommand  } = require('@aws-sdk/client-dynamodb');

const STUDENT_TABLE = process.env.STUDENT_TABLE;

const client = new DynamoDBClient();

exports.handler = async function (event) {
    const httpMethod = event.httpMethod;
    const studentId = event.pathParameters ? event.pathParameters.id : null;
    const body = event.body ? JSON.parse(event.body) : null;

    switch (httpMethod) {
        case 'POST':
            return createStudent(body);
        case 'GET':
            return getStudent();
        case 'PUT':
            return updateStudent(studentId, body);
        case 'DELETE':
            return deleteStudent(studentId);
        default:
            return { statusCode: 400, body: 'Unsupported method' };
    }
};

// Create Student (POST)
async function createStudent(student) {
    const { studentId, name, age, className } = student;

    const params = {
        TableName: STUDENT_TABLE,
        Item: {
            studentId: { S: studentId },
            name: { S: name },
            age: { N: age.toString() },
            className: { S: className }
        }
    };

    try {
        await client.send(new PutItemCommand(params));
        return { statusCode: 201, body: JSON.stringify({ message: 'Student created successfully' }) };
    } catch (error) {
        console.error('Error creating student:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Failed to create student', error: error.message }) };
    }
}

// Get Student (GET)
async function getStudent() {
    const params = {
        TableName: STUDENT_TABLE,
        // Key: {
        //     studentId: { S : studentId }
        // }
    };

    try {
        const data = await client.send(new ScanCommand(params));
        // if (!data.Item) {
        //     return { statusCode: 404, body: JSON.stringify({ message: 'Student not found' }) };
        // }
        const students = data.Items.map((item) => {
            return {
                studentId: item.studentId.S,
                name: item.name.S,
                age: parseInt(item.age.N, 10),
                className: item.className.S
            };
        });
        return { statusCode: 200, body: JSON.stringify({students}) };
    } catch (error) {
        console.error('Error getting student:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Failed to get student', error: error.message }) };
    }
}

// Update Student (PUT)
async function updateStudent(studentId, updates) {
    const { name, age, className } = updates;

    const params = {
        TableName: STUDENT_TABLE,
        Key: {
            studentId: { S: studentId }
        },
        UpdateExpression: 'set #name = :name, age = :age, className = :className',
        ExpressionAttributeNames: {
            '#name': 'name'
        },
        ExpressionAttributeValues: {
            ':name': { S: name },
            ':age': { N: age.toString() },
            ':className': { S: className }
        },
        ReturnValues: 'ALL_NEW'
    };

    try {
        const result = await client.send(new UpdateItemCommand(params));
        const updatedStudent = {
            studentId: result.Attributes.studentId.S,
            name: result.Attributes.name.S,
            age: parseInt(result.Attributes.age.N, 10),
            className: result.Attributes.className.S
        };
        return { statusCode: 200, body: JSON.stringify({ message: 'Student updated successfully', updatedStudent }) };
    } catch (error) {
        console.error('Error updating student:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Failed to update student', error: error.message }) };
    }
}

// Delete Student (DELETE)
async function deleteStudent(studentId) {

    const params = {
        TableName: STUDENT_TABLE,
        Key: {
            studentId: { S: studentId }
        }
    };

    try {
        await client.send(new DeleteItemCommand(params));
        return { statusCode: 200, body: JSON.stringify({ message: 'Student deleted successfully' }) };
    } catch (error) {
        console.error('Error deleting student:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Failed to delete student', error: error.message }) };
    }
}
