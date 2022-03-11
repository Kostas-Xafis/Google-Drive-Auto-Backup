# **Description**
### A project to backup, update & download your files to & from Google Drive.
### What's so special about it? 
### 1. Supports folder & file **exclusions**. (Pretty neat for devs 🧡)
### 2. Any removed/modified/relocated folder/file is **updated**.
### 3. **Downloads** your files in the desired directory. 
### 4. **Maintains** your backuped folder structure both in Drive and after downloading it on your local machine.
### 5. Capable of storing **multiple** backups.

# **Setup**
### **1.** Run on your console:
    git clone https://github.com/Kostas-Xafis/Google-Drive-Auto-Backup.git

    cd Google-Drive-Auto-Backup

    npm install

    tsc -build
---
**Note:** If you have already configured google drive api in a project of yours then skip the next step.
### **2.** Go to [Google Console](https://console.cloud.google.com/ "https://console.cloud.google.com/") and create a new project.
### **2.1** Then go to APIs&Services **>** OAuth consent screen **>** **Click** "Configure Consent Screen" 
### **2.2**  **Check** external **>** Give an app name and an email in the 2 required inputs **>** Save & Continue in Scopes **>** In Test users add the gmail *account where your backups will be saved.
### **2.3** Go to Credentials **>** Create Credentials **>** OAuth client ID **>** **Click** on Desktop App in Application type dropdown **>** **Click** CREATE and then DOWNLOAD JSON.
### **2.4** Finally go to **Marketplace** from the navigation **>** **Search** for "Drive" and click the "Google Drive API" **>** **Click** enable and you are done.
#### ***Note:** Currently the project supports only 1 gmail user.
---
### **3.** Add the downloaded json folder to the projects /json directory and remove the **"installed"** key, so it looks like this:
```json
{
    "client_id": "<client_id>.apps.googleusercontent.com",
    "project_id": "<project_id>",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "<client_secret>",
    "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"]
}
```
---
# **Run**
    # Go inside the generated js folder
    cd js

## **1. Backup & Update**
    node backup <The-directory-to-backup>

## **2. Remove backup**
    #1.Remove local saved files for the backup
    node reset <The-directory-to-remove>
    #2.Both Locally and in Drive
    node reset <The-directory-to-remove> -d
## **3. Download**
    node download <The-directory-to-download> <The-destination-to-install-it>

