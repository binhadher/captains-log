#!/bin/bash
certbot --nginx -d captainslog.ae -d www.captainslog.ae --non-interactive --agree-tos --email dwmcstingray@gmail.com --cert-name captainslog.ae 2>&1 | grep -q "Successfully" && echo "$(date): SSL cert updated with www" >> /opt/captainslog/cert.log && crontab -l | grep -v retry-cert | crontab -
