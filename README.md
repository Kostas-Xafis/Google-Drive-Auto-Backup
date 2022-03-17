# **Description**
### A project to backup, update & download your files to & from Google Drive.
### What's so special about it? 
### 1. Supports folder & file **exclusions**. (Pretty neat for devs 🧡)
### 2. Any removed/modified/relocated folder/file is **updated**.
### 3. **Downloads** your files in the desired directory. 
### 4. **Maintains** your backuped folder structure both in Drive and after downloading it on your local machine.
### 5. Capable of storing **multiple** backups.
### 6. It can be scheduled to update at any given time
# **Setup**
### **1.** Run on your console:
```bash
git clone https://github.com/Kostas-Xafis/Google-Drive-Auto-Backup.git

cd Google-Drive-Auto-Backup

npm install

tsc -build
```
---
**Note:** If you have already configured google drive api in a project of yours then skip the next step.
### **2.** Go to [Google Console](https://console.cloud.google.com/ "https://console.cloud.google.com/") and create a new project.
### **2.1** Then go to APIs&Services **>** OAuth consent screen **>** **Click** "Configure Consent Screen" 
### **2.2**  **Check** external **>** Give an app name and an email in the 2 required inputs **>** Save & Continue in Scopes **>** In Test users add the gmail *account where your backups will be saved.
### **2.3** Go to Credentials **>** Create Credentials **>** OAuth client ID **>** **Click** on Desktop App in Application type dropdown **>** **Click** CREATE and then DOWNLOAD JSON.
### **2.4** Finally go to **Marketplace** from the navigation **>** **Search** for "Drive" and click the "Google Drive API" **>** **Click** enable and you are done.
#### ***Note:** Currently the project supports only 1 gmail user.
---
### **3.** Add the downloaded json file to the project's /json directory and remove the **"installed"** key, so it looks like this:
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
### **4.** Add a file named backupFile.json in the /json folder. Here you can add any glob pattern to exclude from your backup. You can have a general one or specify one for your backup's directory.
```json
{
  "excludePatterns": {
      "*": ["**/node_modules", "etc..."],
      "C:\\Users\\My_name\\personal\\projects\\etc...": [
          "**/.env",
          "**/.vscode",
          "**/target",
          "etc..."
      ]
  },
  "ids": {}
}
```
---
### **5.** If you want your backups to update automatically after a specified amount of time then you should run the setup.(bat/sh) file from the project. (Note *: .sh for unix systems is not ready yet).
```bash
#Options: HOURLY(1-23), DAILY(1-365), WEEKLY(1-52), MONTHLY(1-12)

#Setup a scheduled update every 10 hours
./setup.bat HOURLY 10

#Setup a scheduled update every 15 days
./setup.bat DAILY 15

#Setup a scheduled update every 3 weeks
./setup.bat WEEKLY 3

#Setup a scheduled update every 2 months
./setup.bat MONTHLY 3
```
---
# **Run**
```bash
# Go inside the generated js folder
cd js
```
## **1. Backup & Update**
```bash
#Backup or update a directory
node backup <directory-to-backup> <...>

#Update for all your registered backup directories
node backupAll

```
## **2. Remove backup**
```bash
#1.Remove local saved files for the backup
node reset <directory-to-remove>

#2.Both locally and in Drive
node reset <directory-to-remove> -d
```
## **3. Download**
```bash
node download <directory-to-download> <destination-to-install-it> <...>
```
## **4. Other**
```bash
#If you don't want logs to be generated
node <command> <...> -ls

#if you don't want the output to be wordy
node <command> <...> -l
```

### **Note:** Errors will not be silenced in logs.
---
# **Bugs**
### If any unexpected **error** occurs then post an issue with the resulted error from the generated **logs.log** file (But remove any sensitive data first).
---
## **Limitations**
### **1.** You can not exceed the free 15 GB storage cap, unless you pay a monthly subscription.
### **2.** You can make only 10.000 API calls daily (aka 10.000 file and folder uploads/downloads), unless again you pay a monthly subscription.
### **3.** The automation part is currently only supported for Windows (Working on adding for linux & macOS)
### **4.** Currently the use of multiple gmail accounts is not supported. (Also working on it)