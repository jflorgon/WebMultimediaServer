---
description: Trigger a manual media scan via the API
---

Trigger a manual scan by running:
```
curl -s -X POST http://localhost:5001/api/scanner/trigger
```
Show the response. Then tail the API logs for 10 seconds to show scan progress:
```
python docker-start.py logs --tail=30 mediaserver-api
```
