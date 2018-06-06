#!/bin/bash
cd /var/www/chat/
pwd
whoami
git pull
git status
sudo systemctl daemon-reload
sudo systemctl stop chat
sudo systemctl start chat
sudo systemctl enable chat
