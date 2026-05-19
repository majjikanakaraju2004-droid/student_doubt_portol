# Production Deployment Guide

This guide outlines the steps required to deploy the **Student Doubt System** to a production server (such as an AWS EC2 instance, DigitalOcean Droplet, Linode, or any VPS) using the existing Docker Compose configuration.

---

## Deployment Architecture

The application is fully containerized and orchestrated via `docker-compose.yml`:
* **Frontend**: Optimized React static assets served by an internal **Nginx** container on host port `5173`. Nginx also acts as a reverse-proxy forwarding `/api/`, `/admin/`, and `/django_static/` to the backend.
* **Backend**: Django API running with **Gunicorn** on host port `8000`.
* **Database**: **MySQL 8.0** container on host port `3307`.

---

## Step 1: Server Requirements & Installation

We recommend deploying on a clean **Ubuntu 22.04 LTS** or **Ubuntu 24.04 LTS** VPS with a minimum of **2GB RAM** (to handle Docker, MySQL, and Django side-by-side).

1. Log into your production server via SSH:
   ```bash
   ssh ubuntu@your-server-ip
   ```

2. Update system packages and install Docker:
   ```bash
   sudo apt update && sudo apt upgrade -y
   
   # Install Docker dependencies
   sudo apt install -y apt-transport-https ca-certificates curl software-properties-common gnupg lsb-release
   
   # Add Docker's official GPG key
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
   
   # Set up the stable repository
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   
   # Install Docker Engine
   sudo apt update
   sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
   ```

3. Enable Docker to start on boot:
   ```bash
   sudo systemctl enable docker
   sudo systemctl start docker
   ```

---

## Step 2: Transfer Codebase to Server

Clone your repository directly onto the server using Git, or copy the files using SFTP:
```bash
git clone <your-git-repository-url> /app
cd /app
```

---

## Step 3: Configure Production Environment Variables

Never use development credentials in production. Create a new `docker.env` file in the root directory:
```bash
cp docker.env.example docker.env
nano docker.env
```

Make the following crucial modifications:

```ini
# 1. Change the secret key and disable DEBUG mode
SECRET_KEY=generate-a-strong-random-key-here
DEBUG=False

# 2. Configure Allowed Hosts (replace with your domain or IP address)
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,backend

# 3. Secure MySQL Database (change these passwords to strong, unique values)
DB_NAME=doubt_system
DB_USER=synycs_user
DB_PASSWORD=your-secure-production-db-password
DB_HOST=db
DB_PORT=3306

# 4. Configure CORS Allowed Origins
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# 5. Email Configuration (use your Gmail App Password or SMTP credentials)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=majjikanakaraju2004@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
DEFAULT_FROM_EMAIL=majjikanakaraju2004@gmail.com

# 6. Frontend URL
FRONTEND_URL=https://yourdomain.com
```

---

## Step 4: Build and Deploy the Containers

Build the production containers and boot them in the background (detached mode):
```bash
sudo docker compose -f docker-compose.yml up --build -d
```

Check the status of the containers to ensure everything is running successfully:
```bash
sudo docker compose ps
```

---

## Step 5: Post-Deployment Steps

Once the containers are up, execute the following commands to initialize the Django backend.

1. **Run Database Migrations**:
   ```bash
   sudo docker exec -it synycs-backend python manage.py migrate
   ```

2. **Collect Static Assets** (if not done automatically by the entrypoint):
   ```bash
   sudo docker exec -it synycs-backend python manage.py collectstatic --noinput
   ```

3. **Create a Superuser Account**:
   ```bash
   sudo docker exec -it synycs-backend python manage.py createsuperuser
   ```
   Follow the prompts to enter a username, email, and password.

---

## Step 6: Setting Up Domain Name & SSL (HTTPS)

For secure web access, it is recommended to bind your domain name and install an SSL certificate using Nginx on the host machine.

1. Install Nginx and Certbot on the host:
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```

2. Configure Nginx as a reverse proxy for the Docker frontend container by creating a configuration file:
   ```bash
   sudo nano /etc/nginx/sites-available/student-doubt-system
   ```

3. Paste the following configuration:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:5173; # Directs requests to the Docker frontend container
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. Enable the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/student-doubt-system /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```

5. Install Let's Encrypt SSL Cert:
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```
   Certbot will automatically obtain and install the SSL certificate and configure redirecting all HTTP traffic to HTTPS.

---

## Monitoring and Maintenance

### Viewing Server Logs
To check the logs of your application containers:
```bash
sudo docker compose logs -f
```
Or for a specific service:
```bash
sudo docker compose logs -f backend
sudo docker compose logs -f frontend
```

### Stopping the Application
To shut down the services without losing database data:
```bash
sudo docker compose down
```

### Performing Updates (Zero-Downtime Rebuild)
Whenever you push updates to Git:
```bash
git pull
sudo docker compose up --build -d
```
Docker Compose will build new images in the background and switch them dynamically, ensuring minimal downtime.
