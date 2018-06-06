#!/bin/bash
cd /var/www/chat/
pwd
whoami
git pull
git status
systemctl daemon-reload
systemctl stop chat
systemctl start chat
systemctl enable chat
