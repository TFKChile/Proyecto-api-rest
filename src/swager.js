import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Opciones de configuración de Swagger
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: 'API REST con autenticación Google',
            version: "1.0.0",
            description: "Esta es una API REST creada para manejar autenticación con Google."
        },
        server: [{
            url : "http://localhost:5000"
        }]
    },
    // Asegúrate de actualizar estas rutas con las ubicaciones correctas de tus archivos
    apis: ["src/index.js"], // Rutas a los archivos que contienen documentación de Swagger
};


const swaggerSpec = swaggerJsDoc(options);

// Función para agregar Swagger a una aplicación Express
function setupSwagger(app) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

export default setupSwagger;
