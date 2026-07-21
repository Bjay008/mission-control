# Download the public repository

Mission Control is published as a public GitHub repository:

- Repository: <https://github.com/Bjay008/mission-control>
- ZIP download: <https://github.com/Bjay008/mission-control/archive/refs/heads/main.zip>

## Download as a ZIP

Use the direct ZIP link when you want all repository files without setting up Git first:

```bash
curl -L https://github.com/Bjay008/mission-control/archive/refs/heads/main.zip -o mission-control-main.zip
unzip mission-control-main.zip
cd mission-control-main
```

If you are using GitHub in a browser, open the repository, select **Code**, then select **Download ZIP**.

## Pull with Git

Use Git when you want to keep the folder connected to future repository updates:

```bash
git clone https://github.com/Bjay008/mission-control.git
cd mission-control
git pull origin main
```

After downloading or cloning, install dependencies and start the app:

```bash
npm install
npm run dev
```
