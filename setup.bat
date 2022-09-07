@echo off

set projectDir=%CD%

if not exist schedules ( mkdir schedules )
echo node %projectDir%\js\backupAll.js -s -ls > "./schedules/backup.bat"

set sch=

if %1==HOURLY ( goto hour )
if %1==DAILY ( goto day )
if %1==WEEKLY ( goto week )
if %1==MONTHLY ( goto month ) else ( 
    echo Incorrect time type.
    goto progexit
)

:hour
if %2 geq 1 if %2 leq 23  ( set "sch=/SC HOURLY /MO %2" ) else ( 
    echo Incorrect number of hours.
    goto progexit
)
goto ifexit

:day
if %2 geq 1 if %2 leq 365 ( set "sch=/SC DAILY /MO %2" ) else ( 
    echo Incorrect number of days.
    goto progexit
)
goto ifexit

:week
if %2 geq 1 if %2 leq 52  ( set "sch=/SC WEEKLY /MO %2" ) else ( 
    echo Incorrect number of weeks.
    goto progexit
)
goto ifexit

:month
if %2 geq 1 if %2 leq 12  ( set "sch=/SC MONTHLY /MO %2" ) else ( 
    echo Incorrect number of months.
    goto progexit
)
goto ifexit

:ifexit

SCHTASKS /Create /F /TN "Google Drive Auto Backup" /TR "%projectDir%/schedules/backup.bat" %sch%

:progexit