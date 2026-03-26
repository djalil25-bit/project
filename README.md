# AgriGov Market

## Phase 4: Setup Instructions

### Environment Variables
1. Navigate to the `backend/` directory.
2. Ensure you have a `.env` file based on the provided `.env.example`.
```env
SECRET_KEY=your-secret-key
DEBUG=True
DB_NAME=agrigov
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
```

### Backend Setup
1. The project is currently configured to use `db.sqlite3` out of the box so that it runs immediately without requiring a PostgreSQL installation.
   - *Note: To switch to PostgreSQL as per true production requirements, uncomment the PostgreSQL DATABASES section in `backend/config/settings.py`.*
2. Move into the backend folder: `cd backend`
3. Create a virtual environment: `python -m venv venv`
4. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
5. Install dependencies: `pip install -r requirements.txt`
6. Apply migrations: 
   ```bash
   python manage.py makemigrations accounts common farms catalog pricing cart orders logistics payments dashboards
   python manage.py migrate
   ```
7. Start the server: `python manage.py runserver`

### Initial Admin / Superuser Creation
To use the admin panel and validate other accounts:
```bash
python manage.py createsuperuser
```
Follow the prompts to enter an email, full name, and password. This user will automatically be created with the `admin` role and `approved` status.

### Frontend Setup
1. Open a new terminal and navigate to `frontend/`.
2. Run `npm install` to install React dependencies.
3. Run `npm start` to start the React development server.
4. The application will be accessible at `http://localhost:3000`.

### Demo Flow
1. Register a new user at `http://localhost:3000/register` as a Farmer, Buyer, or Transporter.
2. As the new user, you will be in a "Pending" state and cannot fully log in until approved.
3. Login at `http://localhost:3000/login` with your Admin/Superuser account. You will be redirected to the Admin Dashboard.
4. In the Admin Dashboard, approve the pending user accounts.
5. Log out, then log in as the approved Farmer/Buyer/Transporter to view role-specific dashboards.
