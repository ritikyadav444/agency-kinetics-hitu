# Dockerfile
FROM public.ecr.aws/lambda/nodejs:18

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy app files
COPY . .

# Command to run the Lambda handler
CMD ["lambda.handler"]