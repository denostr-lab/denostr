#!/bin/bash

mongo --quiet $MONGO_URI <<EOF
var config = {
    "_id": "rs0",
    "version": 1,
    "members": [
        {
            "_id": 1,
            "host": "denostr-db:27017",
            "priority": 1
        },
    ]
};
rs.initiate(config, { force: true });
rs.status();
EOF
