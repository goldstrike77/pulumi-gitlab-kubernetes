import * as pulumi from "@pulumi/pulumi";
import * as k8s from './pulumi-ts-module-kubernetes';
import * as fs from 'fs';

let config = new pulumi.Config();

const podlabels = {
    customer: "it",
    environment: "prd",
    project: "container",
    group: "rke-it-prd-infra-shared-01",
    datacenter: "cn-north",
    domain: "local"
}

const resources = [
    {
        namespace: [
            {
                metadata: {
                    name: "monitoring",
                    annotations: {},
                    labels: {
                        "pod-security.kubernetes.io/enforce": "privileged",
                        "pod-security.kubernetes.io/audit": "privileged",
                        "pod-security.kubernetes.io/info": "privileged"
                    }
                },
                spec: {}
            }
        ],
        configmap: [],
        release: [
            {
                namespace: "monitoring",
                name: "loki",
                chart: "oci://harbor.home.local/helm-charts/loki",
                version: "6.29.0",
                values: {
                    global: {
                        image: {
                            registry: "swr.cn-east-3.myhuaweicloud.com"
                        }
                    },
                    deploymentMode: "Distributed",
                    loki: {
                        image: { repository: "docker-io/loki" },
                        podLabels: podlabels,
                        auth_enabled: false,
                        tenants: [],
                        server: {
                            grpc_server_max_recv_msg_size: 524288000,
                            grpc_server_max_send_msg_size: 524288000
                        },
                        limits_config: {
                            allow_structured_metadata: true,
                            ingestion_burst_size_mb: 64,
                            ingestion_rate_mb: 32,
                            ingestion_rate_strategy: "global",
                            max_cache_freshness_per_query: "10m",
                            max_entries_limit_per_query: 10000,
                            max_global_streams_per_user: 100000,
                            max_line_size: "64kb",
                            max_line_size_truncate: true,
                            query_timeout: "300s",
                            reject_old_samples: true,
                            reject_old_samples_max_age: "120h",
                            retention_period: "120h",
                            split_queries_by_interval: "15m",
                            volume_enabled: true
                        },
                        storage: {
                            bucketNames: {
                                chunks: "loki",
                                ruler: "loki",
                                admin: "loki"
                            },
                            type: "s3",
                            s3: {
                                endpoint: "obs.home.local",
                                region: "us-east-1",
                                secretAccessKey: config.require("AWS_SECRET_ACCESS_KEY"),
                                accessKeyId: config.require("AWS_ACCESS_KEY_ID"),
                                s3ForcePathStyle: true,
                                insecure: false,
                                http_config: {
                                    idle_conn_timeout: "2m",
                                    insecure_skip_verify: true,
                                    response_header_timeout: "5m"
                                }
                            }
                        },
                        schemaConfig: {
                            configs: [
                                {
                                    from: "2024-04-01",
                                    store: "tsdb",
                                    object_store: "s3",
                                    schema: "v13",
                                    index: {
                                        prefix: "loki_index_",
                                        period: "24h"
                                    }
                                }
                            ]
                        },
                        analytics: { reporting_enabled: false },
                        ingester: { "chunk_encoding": "snappy" },
                        tracing: { "enabled": false },
                        querier: { "max_concurrent": 4 }
                    },
                    gateway: { enabled: false },
                    ingester: {
                        replicas: 3,
                        resources: {
                            limits: { cpu: "500m", memory: "2048Mi" },
                            requests: { cpu: "500m", memory: "2048Mi" }
                        },
                        persistence: {
                            enabled: true,
                            claims: [
                                {
                                    name: "data",
                                    size: "7Gi",
                                    storageClass: "vsphere-san-sc"
                                }
                            ]
                        },
                        zoneAwareReplication: { enabled: true }
                    },
                    distributor: {
                        replicas: 3,
                        maxUnavailable: 1,
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        }
                    },
                    querier: {
                        replicas: 1,
                        resources: {
                            limits: { cpu: "200m", memory: "512Mi" },
                            requests: { cpu: "200m", memory: "512Mi" }
                        }
                    },
                    queryFrontend: {
                        replicas: 1,
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        }
                    },
                    queryScheduler: {
                        replicas: 1,
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        }
                    },
                    indexGateway: {
                        replicas: 1,
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        }
                    },
                    compactor: {
                        replicas: 1,
                        resources: {
                            limits: { cpu: "500m", memory: "1024Mi" },
                            requests: { cpu: "500m", memory: "1024Mi" }
                        },
                        persistence: {
                            enabled: true,
                            size: "7Gi",
                            storageClass: "vsphere-san-sc"
                        }
                    },
                    ruler: {
                        enabled: false,
                        replicas: 0,
                        resources: {},
                        directories: {}
                    },
                    memcached: {
                        image: { repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/memcached" }
                    },
                    memcachedExporter: {
                        image: { repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/memcached-exporter" },
                        resources: {
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        }
                    },
                    resultsCache: {
                        enabled: true,
                        defaultValidity: "12h",
                        replicas: 1,
                        allocatedMemory: 1024,
                        maxItemMemory: 5,
                        connectionLimit: 16384,
                        writebackSizeLimit: "500MB",
                        writebackBuffer: 500000,
                        writebackParallelism: 1,
                        resources: {
                            limits: { cpu: "100m", memory: "1056Mi" },
                            requests: { cpu: "100m", memory: "1056Mi" }
                        }
                    },
                    chunksCache: {
                        enabled: true,
                        batchSize: 4,
                        parallelism: 5,
                        timeout: "2000ms",
                        defaultValidity: "0s",
                        replicas: 1,
                        allocatedMemory: 2048,
                        maxItemMemory: 5,
                        connectionLimit: 16384,
                        writebackSizeLimit: "500MB",
                        writebackBuffer: 500000,
                        writebackParallelism: 1,
                        initContainers: [],
                        resources: {
                            limits: { cpu: "100m", memory: "2080Mi" },
                            requests: { cpu: "100m", memory: "2080Mi" }
                        }
                    },
                    "sidecar": {
                        image: { repository: "quay-io/k8s-sidecar" },
                        resources: {}
                    },
                    monitoring: {
                        serviceMonitor: {
                            enabled: true,
                            interval: "60s",
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                            ],
                            metricsInstance: {
                                enabled: true
                            }
                        }
                    },
                    test: { enabled: false },
                    lokiCanary: { enabled: false },
                    backend: { replicas: 0 },
                    read: { replicas: 0 },
                    write: { replicas: 0 },
                    singleBinary: { replicas: 0 }
                }
            },
            {
                namespace: "monitoring",
                name: "tempo-distributed",
                chart: "oci://harbor.home.local/helm-charts/tempo-distributed",
                version: "1.33.0",
                values: {
                    global: {
                        image: {
                            registry: "registry.cn-shanghai.aliyuncs.com"
                        }
                    },
                    fullnameOverride: "tempo",
                    tempo: {
                        image: {
                            repository: "goldenimage/tempo"
                        },
                        podLabels: podlabels,
                    },
                    ingester: {
                        replicas: 3,
                        resources: {
                            limits: { cpu: "2000m", memory: "4096Mi" },
                            requests: { cpu: "2000m", memory: "4096Mi" }
                        },
                        persistence: {
                            enabled: true,
                            size: "7Gi",
                            storageClass: "vsphere-san-sc"
                        },
                        config: {
                            flush_check_period: "5s",
                            trace_idle_period: "5s",
                            flush_all_on_shutdown: true
                        },
                        zoneAwareReplication: {
                            enabled: true,
                            topologyKey: "kubernetes.io/hostname"
                        }
                    },
                    metricsGenerator: {
                        enabled: true,
                        replicas: 1,
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        },
                        persistence: {
                            enabled: true,
                            size: "7Gi",
                            storageClass: "vsphere-san-sc"
                        }
                    },
                    distributor: {
                        replicas: 3,
                        resources: {
                            limits: { cpu: "200m", memory: "2048Mi" },
                            requests: { cpu: "200m", memory: "2048Mi" }
                        }
                    },
                    compactor: {
                        replicas: 1,
                        resources: {
                            limits: { cpu: "2000m", memory: "4096Mi" },
                            requests: { cpu: "2000m", memory: "4096Mi" }
                        },
                        config: {
                            compaction: {
                                block_retention: "120h",
                                compaction_cycle: "60s"
                            }
                        }
                    },
                    querier: {
                        replicas: 1,
                        resources: {
                            limits: { cpu: "200m", memory: "1024Mi" },
                            requests: { cpu: "200m", memory: "1024Mi" }
                        }
                    },
                    queryFrontend: {
                        replicas: 1,
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        }
                    },
                    multitenancyEnabled: false,
                    traces: {
                        jaeger: {
                            grpc: { enabled: true },
                            thriftBinary: { enabled: true },
                            thriftCompact: { enabled: true },
                            thriftHttp: { enabled: true }
                        },
                        zipkin: { enabled: true },
                        otlp: {
                            http: { enabled: true },
                            grpc: { enabled: true }
                        },
                        opencensus: { enabled: true }
                    },
                    server: { logLevel: "info" },
                    storage: {
                        trace: {
                            backend: "s3",
                            s3: {
                                bucket: "tempo",
                                endpoint: "obs.home.local",
                                region: "us-east-1",
                                access_key: config.require("AWS_ACCESS_KEY_ID"),
                                secret_key: config.require("AWS_SECRET_ACCESS_KEY"),
                                insecure: true,
                                hedge_requests_at: "1000ms",
                                hedge_requests_up_to: 2
                            }
                        }
                    },
                    memcached: {
                        enabled: true,
                        extraArgs: ["-m 200", "-I 2m", "-v"],
                        image: {
                            repository: "goldenimage/memcached",
                            tag: "1.6.38-alpine"
                        },
                        resources: {
                            limits: { cpu: "100m", memory: "256Mi" },
                            requests: { cpu: "100m", memory: "256Mi" }
                        }
                    },
                    memcachedExporter: {
                        enabled: true,
                        image: {
                            repository: "goldenimage/memcached-exporter",
                            tag: "v0.15.2"
                        },
                        resources: {
                            limits: { cpu: "50m", memory: "64Mi" },
                            requests: { cpu: "50m", memory: "64Mi" }
                        }
                    },
                    metaMonitoring: {
                        serviceMonitor: {
                            enabled: true,
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                            ]
                        }
                    },
                    prometheusRule: {
                        enabled: false
                    }
                }
            },
            {
                namespace: "monitoring",
                name: "grafana",
                chart: "oci://harbor.home.local/helm-charts/grafana",
                version: "8.11.0",
                values: {
                    global: {
                        imageRegistry: "swr.cn-east-3.myhuaweicloud.com"
                    },
                    replicas: 1,
                    image:
                    {
                        repository: "docker-io/grafana",
                        tag: "11.6.0",
                    },
                    deploymentStrategy: {
                        type: "RollingUpdate",
                        rollingUpdate: {
                            maxSurge: 0,
                            maxUnavailable: 1
                        }
                    },
                    podLabels: podlabels,
                    serviceMonitor: {
                        enabled: true,
                        relabelings: [
                            { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                        ]
                    },
                    ingress: { enabled: false },
                    resources: {
                        limits: { cpu: "200m", memory: "384Mi" },
                        requests: { cpu: "200m", memory: "384Mi" }
                    },
                    persistence: {
                        enabled: true,
                        storageClassName: "vsphere-san-sc",
                        size: "7Gi"
                    },
                    initChownData: {
                        enabled: true,
                        image: {
                            repository: "docker-io/busybox",
                            tag: "1.36.1"
                        },
                        resources: {
                            limits: { cpu: "50m", memory: "64Mi" },
                            requests: { cpu: "50m", memory: "64Mi" }
                        }
                    },
                    adminUser: "admin",
                    adminPassword: config.require("adminPassword"),
                    plugins: [
                        "apache-skywalking-datasource",
                        "camptocamp-prometheus-alertmanager-datasource",
                        "grafana-oncall-app",
                        "grafana-piechart-panel"
                    ],
                    datasources: {
                        "datasources.yaml": {
                            apiVersion: 1,
                            datasources: [
                                {
                                    name: "DS_TEMPO",
                                    type: "tempo",
                                    access: "proxy",
                                    url: "http://tempo-query-frontend:3100",
                                    version: 1
                                },
                                {
                                    name: "DS_LOKI",
                                    type: "loki",
                                    access: "proxy",
                                    url: "http://loki-query-frontend:3100",
                                    version: 1,
                                    jsonData: {
                                        maxLines: 5000,
                                        httpHeaderName1: "X-Scope-OrgID"
                                    }
                                },
                                {
                                    name: "DS_PROMETHEUS",
                                    type: "prometheus",
                                    access: "proxy",
                                    url: "http://mimir-query-frontend:8080/prometheus",
                                    jsonData: {
                                        maxLines: 5000,
                                        httpHeaderName1: "X-Scope-OrgID",
                                        httpMethod: "POST",
                                        oauthPassThru: false,
                                        prometheusType: "Mimir",
                                        prometheusVersion: "2.9.1"
                                    },
                                    secureJsonFields: {
                                        httpHeaderValue1: true
                                    }
                                }

                            ]
                        }
                    },
                    "grafana.ini": {
                        server: {
                            root_url: "https://grafana-lgtm.home.local",
                        },
                        paths: {
                            data: "/var/lib/grafana/",
                            logs: "/var/log/grafana",
                            plugins: "/var/lib/grafana/plugins",
                            provisioning: "/etc/grafana/provisioning",
                        },
                        dataproxy: {
                            timeout: "60",
                            keep_alive_seconds: "60"
                        },
                        analytics: {
                            check_for_updates: false,
                            reporting_enabled: false
                        },
                        log: { mode: "console", level: "info" },
                        user: {
                            default_theme: "dark",
                            home_page: ""
                        }
                    },
                    sidecar: {
                        image: {
                            repository: "quay-io/k8s-sidecar",
                            tag: "1.30.0"
                        },
                        resources: {
                            limits: { cpu: "50m", memory: "128Mi" },
                            requests: { cpu: "50m", memory: "128Mi" }
                        },
                        dashboards: { enabled: true, label: "grafana_dashboard" }
                    }
                }
            },
            {
                namespace: "monitoring",
                name: "mimir-distributed",
                chart: "oci://harbor.home.local/helm-charts/mimir-distributed",
                version: "5.6.0",
                values: {
                    fullnameOverride: "mimir",
                    image: {
                        repository: "registry.cn-shanghai.aliyuncs.com/goldenimage/mimir"
                    },
                    global: {
                        podLabels: podlabels,
                    },
                    mimir: {
                        structuredConfig: {
                            usage_stats: { enabled: false },
                            multitenancy_enabled: false,
                            common: {
                                storage: {
                                    backend: "s3",
                                    s3: {
                                        endpoint: "obs.home.local",
                                        region: "us-east-1",
                                        secret_access_key: config.require("AWS_SECRET_ACCESS_KEY"),
                                        access_key_id: config.require("AWS_ACCESS_KEY_ID"),
                                        http: {
                                            insecure_skip_verify: true
                                        }
                                    }
                                }
                            },
                            blocks_storage: {
                                s3: {
                                    bucket_name: "mimir-blocks"
                                }
                            },
                            alertmanager_storage: {
                                s3: {
                                    bucket_name: "mimir-alertmanager"
                                }
                            },
                            ruler_storage: {
                                s3: {
                                    bucket_name: "mimir-ruler"
                                }
                            },
                            limits: {
                                compactor_blocks_retention_period: "120h",
                                ingestion_burst_size: 2000000,
                                ingestion_rate: 100000,
                                max_global_series_per_user: 1000000,
                                max_label_names_per_series: 50,
                                max_query_parallelism: 30
                            }
                        }
                    },
                    alertmanager: { enabled: false },
                    compactor: {
                        persistentVolume: {
                            size: "7Gi",
                            storageClass: "vsphere-san-sc"
                        },
                        resources: {
                            limits: { cpu: "500m", memory: "1024Mi" },
                            requests: { cpu: "500m", memory: "1024Mi" }
                        }
                    },
                    distributor: {
                        replicas: 3,
                        resources: {
                            limits: { cpu: "500m", memory: "1024Mi" },
                            requests: { cpu: "500m", memory: "1024Mi" }
                        }
                    },
                    ingester: {
                        persistentVolume: {
                            size: "31Gi",
                            storageClass: "vsphere-san-sc"
                        },
                        replicas: 3,
                        resources: {
                            limits: { cpu: "500m", memory: "1024Mi" },
                            requests: { cpu: "500m", memory: "1024Mi" }
                        },
                        zoneAwareReplication: {
                            enabled: true,
                            topologyKey: "kubernetes.io/hostname"
                        }
                    },
                    memcached: {
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/memcached",
                            tag: "1.6.38-alpine"
                        }
                    },
                    memcachedExporter: {
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/memcached-exporter",
                            tag: "v0.15.2"
                        },
                        resources: {
                            limits: { cpu: "100m", memory: "64Mi" },
                            requests: { cpu: "100m", memory: "64Mi" }
                        }
                    },
                    "admin-cache": {
                        enabled: true,
                        replicas: 1,
                        allocatedMemory: 64,
                        resources: {
                            limits: { cpu: "100m", memory: "96Mi" },
                            requests: { cpu: "100m", memory: "96Mi" }
                        }
                    },
                    "chunks-cache": {
                        enabled: true,
                        replicas: 1,
                        allocatedMemory: 2048,
                        resources: {
                            limits: { cpu: "100m", memory: "2080Mi" },
                            requests: { cpu: "100m", memory: "2080Mi" }
                        }
                    },
                    "index-cache": {
                        enabled: true,
                        replicas: 1,
                        allocatedMemory: 1024,
                        resources: {
                            limits: { cpu: "100m", memory: "1056Mi" },
                            requests: { cpu: "100m", memory: "1056Mi" }
                        }
                    },
                    "metadata-cache": {
                        enabled: true,
                        replicas: 1,
                        allocatedMemory: 256,
                        resources: {
                            limits: { cpu: "100m", memory: "288Mi" },
                            requests: { cpu: "100m", memory: "288Mi" }
                        }
                    },
                    "results-cache": {
                        enabled: true,
                        replicas: 1,
                        allocatedMemory: 256,
                        resources: {
                            limits: { cpu: "100m", memory: "288Mi" },
                            requests: { cpu: "100m", memory: "288Mi" }
                        }
                    },
                    rollout_operator: {
                        image: {
                            repository: "registry.cn-shanghai.aliyuncs.com/goldenimage/rollout-operator",
                            tag: "v0.24.0"
                        },
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        }
                    },
                    minio: { enabled: false },
                    "overrides_exporter": {
                        replicas: 1,
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        }
                    },
                    querier: {
                        replicas: 1,
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        }
                    },
                    query_frontend: {
                        replicas: 1,
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        }
                    },
                    query_scheduler: {
                        replicas: 1,
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        }
                    },
                    ruler: {
                        replicas: 1,
                        resources: {
                            limits: { cpu: "500m", memory: "1024Mi" },
                            requests: { cpu: "500m", memory: "1024Mi" }
                        }
                    },
                    store_gateway: {
                        persistentVolume: {
                            size: "31Gi",
                            storageClass: "vsphere-san-sc"
                        },
                        replicas: 3,
                        resources: {
                            limits: { cpu: "500m", memory: "1024Mi" },
                            requests: { cpu: "500m", memory: "1024Mi" }
                        },
                        zoneAwareReplication: {
                            enabled: true,
                            topologyKey: "kubernetes.io/hostname"
                        }
                    },
                    nginx: { enabled: false },
                    admin_api: { enabled: false },
                    gateway: {
                        enabledNonEnterprise: true,
                        replicas: 1,
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        },
                        nginx: {
                            verboseLogging: false,
                            image: {
                                registry: "swr.cn-east-3.myhuaweicloud.com",
                                repository: "docker-io/nginx-unprivileged",
                                tag: "1.27-alpine"
                            }
                        }
                    },
                    metaMonitoring: {
                        serviceMonitor: {
                            enabled: true,
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                            ],
                            interval: "60s",
                            scrapeTimeout: "30s"
                        },
                        prometheusRule: { enabled: false }
                    }
                }
            },
            {
                namespace: "monitoring",
                name: "opentelemetry-collector",
                chart: "oci://harbor.home.local/helm-charts/opentelemetry-collector",
                version: "0.120.1",
                values: {
                    mode: "deployment",
                    config: {
                        exporters: {
                            "otlphttp/metrics": {
                                endpoint: "http://mimir-distributor:8080/otlp",
                                tls: { insecure: true }
                            },
                            "otlp/traces": {
                                endpoint: "http://tempo-distributor:4317",
                                tls: { insecure: true }
                            },
                            "otlphttp/logs": {
                                endpoint: "http://loki-distributor:3100/otlp",
                                tls: { insecure: true }
                            }
                        },
                        processors: {
                            filter: {
                                spans: {
                                    exclude: {
                                        match_type: "regexp",
                                        attributes: [
                                            { key: "http.target", value: ".*/health" }
                                        ]
                                    }
                                }
                            }
                        },
                        receivers: {
                            jaeger: {
                                protocols: {
                                    grpc: { endpoint: "${env:MY_POD_IP}:14250" },
                                    thrift_http: { endpoint: "${env:MY_POD_IP}:14268" },
                                    thrift_compact: { endpoint: "${env:MY_POD_IP}:6831" }
                                }
                            },
                            otlp: {
                                protocols: {
                                    grpc: { endpoint: "${env:MY_POD_IP}:4317" },
                                    http: { endpoint: "${env:MY_POD_IP}:4318" }
                                }
                            },
                            prometheus: {
                                config: {
                                    scrape_configs: [
                                        {
                                            job_name: "opentelemetry-collector",
                                            scrape_interval: "10s",
                                            static_configs: [
                                                {
                                                    targets: ["${env:MY_POD_IP}:8888"]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            },
                            zipkin: {
                                endpoint: "${env:MY_POD_IP}:9411"
                            }
                        },
                        service: {
                            telemetry: {
                                metrics: {
                                    address: "${env:MY_POD_IP}:8888"
                                }
                            },
                            extensions: ["health_check"],
                            pipelines: {
                                traces: {
                                    receivers: ["otlp", "jaeger", "zipkin"],
                                    processors: ["memory_limiter", "batch", "filter"],
                                    exporters: ["otlp/traces"]
                                },
                                metrics: {
                                    receivers: ["otlp", "prometheus"],
                                    processors: ["memory_limiter", "batch"],
                                    exporters: ["otlphttp/metrics"]
                                },
                                logs: {
                                    receivers: ["otlp"],
                                    processors: ["memory_limiter", "batch"],
                                    exporters: ["otlphttp/logs"]
                                }
                            }
                        }
                    },
                    image: {
                        repository: "registry.cn-shanghai.aliyuncs.com/goldenimage/opentelemetry-collector",
                        tag: "0.122.1"
                    },
                    resources: {
                        limits: { cpu: "500m", memory: "512Mi" },
                        requests: { cpu: "500m", memory: "512Mi" }
                    },
                    podLabels: podlabels,
                    replicaCount: 1,
                    serviceMonitor: {
                        enabled: false,
                        relabelings: [
                            { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                            { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                        ]
                    }
                }
            },
            {
                namespace: "monitoring",
                name: "cert-manager",
                chart: "oci://harbor.home.local/helm-charts/cert-manager",
                version: "1.4.13",
                values: {
                    global: {
                        imageRegistry: "swr.cn-east-3.myhuaweicloud.com",
                        security: {
                            allowInsecureImages: true
                        }
                    },
                    logLevel: 2,
                    installCRDs: true,
                    controller: {
                        replicaCount: 1,
                        image: {
                            repository: "docker-io/cert-manager"
                        },
                        acmesolver: {
                            image: {
                                repository: "docker-io/acmesolver"
                            }
                        },
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        },
                        podLabels: podlabels,
                    },
                    webhook: {
                        replicaCount: 1,
                        image: {
                            repository: "docker-io/cert-manager-webhook"
                        },
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        },
                        podLabels: podlabels
                    },
                    cainjector: {
                        replicaCount: 1,
                        image: {
                            repository: "docker-io/cainjector"
                        },
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        },
                        podLabels: podlabels,
                    },
                    metrics: {
                        enabled: false,
                        serviceMonitor: {
                            enabled: false,
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                            ]
                        }
                    }
                }
            },
            {
                namespace: "monitoring",
                name: "opentelemetry-operator",
                chart: "oci://harbor.home.local/helm-charts/opentelemetry-operator",
                version: "0.84.2",
                values: {
                    "replicaCount": 1,
                    "manager": {
                        "image": {
                            "repository": "registry.cn-shanghai.aliyuncs.com/goldenimage/opentelemetry-operator",
                            "tag": "0.120.0"
                        },
                        "collectorImage": {
                            "repository": "registry.cn-shanghai.aliyuncs.com/goldenimage/opentelemetry-collector-k8s",
                            "tag": "0.120.0"
                        },
                        "opampBridgeImage": {
                            "repository": "",
                            "tag": ""
                        },
                        "targetAllocatorImage": {
                            "repository": "",
                            "tag": ""
                        },
                        "autoInstrumentationImage": {
                            "java": {
                                "repository": "registry.cn-shanghai.aliyuncs.com/goldenimage/autoinstrumentation-java",
                                "tag": "1.26.0"
                            },
                            "nodejs": {
                                "repository": "",
                                "tag": ""
                            },
                            "python": {
                                "repository": "",
                                "tag": ""
                            },
                            "dotnet": {
                                "repository": "",
                                "tag": ""
                            },
                            "apacheHttpd": {
                                "repository": "",
                                "tag": ""
                            },
                            "go": {
                                "repository": "",
                                "tag": ""
                            }
                        },
                        "resources": {},
                        "env": {
                            "ENABLE_WEBHOOKS": "true"
                        },
                        "serviceMonitor": {
                            "enabled": false
                        },
                        "podLabels": {},
                        "prometheusRule": {
                            "enabled": false
                        }
                    },
                    "kubeRBACProxy": {
                        "enabled": true,
                        "image": {
                            "repository": "swr.cn-east-3.myhuaweicloud.com/gcr-io/kube-rbac-proxy",
                            "tag": "v0.18.1"
                        },
                        "resources": {}
                    },
                    "testFramework": {
                        "image": {
                            "repository": "swr.cn-east-3.myhuaweicloud.com/docker-io/busybox",
                            "tag": "1.36.1"
                        }
                    }
                }
            },
            {
                namespace: "monitoring",
                name: "mariadb",
                chart: "oci://harbor.home.local/helm-charts/mariadb",
                version: "13.1.3",
                values: {
                    fullnameOverride: "mysql",
                    image: {
                        registry: "swr.cn-east-3.myhuaweicloud.com",
                        repository: "docker-io/mariadb",
                        tag: "10.11.5-debian-11-r49"
                    },
                    architecture: "standalone",
                    auth: {
                        rootPassword: config.require("rootPassword"),
                        createDatabase: true,
                        database: "spring-boot",
                        username: "spring-boot",
                        password: config.require("userPassword")
                    },
                    initdbScripts: {
                        "my_init_script.sh": `
#!/bin/bash
mysql -uroot -p${config.require("rootPassword")} -e "use spring-boot;CREATE TABLE pet (name VARCHAR(20), owner VARCHAR(20), species VARCHAR(20), sex CHAR(1), birth DATE, death DATE);"
mysql -uroot -p${config.require("rootPassword")} -e "use spring-boot;INSERT INTO pet VALUES ('Puffball','Diane','hamster','f','1999-03-30',NULL);"
`
                    },
                    primary: {
                        configuration: `
[mysqld]
skip-log-bin
skip-name-resolve
explicit_defaults_for_timestamp
basedir=/opt/bitnami/mariadb
plugin_dir=/opt/bitnami/mariadb/plugin
port=3306
socket=/opt/bitnami/mariadb/tmp/mysql.sock
tmpdir=/opt/bitnami/mariadb/tmp
max_allowed_packet=16M
bind-address=0.0.0.0
pid-file=/opt/bitnami/mariadb/tmp/mysqld.pid
log-error=/opt/bitnami/mariadb/logs/mysqld.log
character-set-server=UTF8
collation-server=utf8_general_ci
slow_query_log_file=/opt/bitnami/mariadb/logs/mysqld.log
slow_query_log=0
max_connections=100
performance_schema_max_table_instances=256
table_definition_cache=400
table_open_cache=128
innodb_buffer_pool_size=256M
innodb_flush_log_at_trx_commit=2
query_response_time_stats=1
plugin_load_add=query_response_time

[client]
port=3306
socket=/opt/bitnami/mariadb/tmp/mysql.sock
default-character-set=UTF8
plugin_dir=/opt/bitnami/mariadb/plugin

[manager]
port=3306
socket=/opt/bitnami/mariadb/tmp/mysql.sock
pid-file=/opt/bitnami/mariadb/tmp/mysqld.pid
`,
                        extraEnvVars: [
                            { name: "MARIADB_COLLATE", value: "utf8mb4_unicode_ci" },
                            { name: "MARIADB_CHARACTER_SET", value: "utf8mb4" }
                        ],
                        resources: {
                            limits: { cpu: "250m", memory: "512Mi" },
                            requests: { cpu: "250m", memory: "512Mi" }
                        },
                        persistence: {
                            enabled: true,
                            storageClass: "vsphere-san-sc",
                            size: "7Gi"
                        },
                        podLabels: podlabels,
                        podSecurityContext: {
                            fsGroup: 1000700000
                        },
                        containerSecurityContext: {
                            runAsUser: 1000700000
                        },
                    },
                    volumePermissions: { enabled: false },
                    metrics: {
                        enabled: true,
                        image: {
                            registry: "swr.cn-east-3.myhuaweicloud.com",
                            repository: "docker-io/mysqld-exporter",
                            tag: "0.15.1-debian-12-r29"
                        },
                        extraArgs: {
                            primary: [
                                "--collect.auto_increment.columns",
                                "--collect.binlog_size",
                                "--collect.engine_innodb_status",
                                "--collect.global_status",
                                "--collect.global_variables",
                                "--collect.info_schema.clientstats",
                                "--collect.info_schema.innodb_metrics",
                                "--collect.info_schema.innodb_cmp",
                                "--collect.info_schema.innodb_cmpmem",
                                "--collect.info_schema.processlist",
                                "--collect.info_schema.query_response_time",
                                "--collect.info_schema.tables",
                                "--collect.info_schema.tablestats",
                                "--collect.info_schema.schemastats",
                                "--collect.info_schema.userstats",
                                "--collect.perf_schema.eventsstatements",
                                "--collect.perf_schema.eventswaits",
                                "--collect.perf_schema.file_events",
                                "--collect.perf_schema.file_instances",
                                "--collect.perf_schema.indexiowaits",
                                "--collect.perf_schema.tableiowaits",
                                "--collect.perf_schema.tablelocks"
                            ]
                        },
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        },
                        livenessProbe: {
                            enabled: true,
                            initialDelaySeconds: 120,
                            periodSeconds: 10,
                            timeoutSeconds: 10,
                            successThreshold: 1,
                            failureThreshold: 3
                        },
                        readinessProbe: {
                            enabled: true,
                            initialDelaySeconds: 30,
                            periodSeconds: 10,
                            timeoutSeconds: 10,
                            successThreshold: 1,
                            failureThreshold: 3
                        },
                        serviceMonitor: {
                            enabled: false,
                            interval: "60s",
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                            ]
                        },
                        prometheusRule: {
                            enabled: false,
                            namespace: "",
                            rules: []
                        }
                    }
                }
            },
        ],
        deployment: [
            {
                metadata: {
                    labels: {
                        app: "spring-boot"
                    },
                    name: "spring-boot",
                    namespace: "monitoring"
                },
                spec: {
                    replicas: 1,
                    selector: {
                        matchLabels: {
                            app: "spring-boot"
                        }
                    },
                    template: {
                        metadata: {
                            labels: {
                                app: "spring-boot",
                                customer: "it",
                                environment: "prd",
                                project: "container",
                                group: "rke-it-prd-infra-shared-01",
                                datacenter: "cn-north",
                                domain: "local"
                            },
                            annotations: {
                                "instrumentation.opentelemetry.io/inject-java": "true"
                            }
                        },
                        spec: {
                            containers: [
                                {
                                    image: "registry.cn-hangzhou.aliyuncs.com/goldenimage/spring-boot-kubernetes-mysql:v6.0.0@sha256:7ef5527285c71701b53936fb5b0aee6154f6127224b6e0c0df976a0077e14d15",
                                    name: "spring-boot",
                                    livenessProbe: {
                                        httpGet: {
                                            path: "/api/v1/actuator/health",
                                            port: 8080
                                        },
                                        initialDelaySeconds: 30,
                                        periodSeconds: 5
                                    },
                                    readinessProbe: {
                                        failureThreshold: 3,
                                        tcpSocket: {
                                            port: 8080
                                        },
                                        initialDelaySeconds: 30,
                                        periodSeconds: 10,
                                        successThreshold: 1,
                                        timeoutSeconds: 10
                                    },
                                    resources: {
                                        limits: { cpu: "2000m", memory: "512Mi" },
                                        requests: { cpu: "2000m", memory: "512Mi" }
                                    },
                                    ports: [
                                        {
                                            containerPort: 8080,
                                            name: "http",
                                            protocol: "TCP",
                                            targetPort: 8080,
                                            nodePort: 31371
                                        }
                                    ],
                                    env: [
                                        { name: "SPRING_DATASOURCE_URL", value: "jdbc:mysql://mysql/spring-boot" },
                                        { name: "SPRING_DATASOURCE_USERNAME", value: "spring-boot" },
                                        { name: "SPRING_DATASOURCE_PASSWORD", value: config.require("userPassword") },
                                        { name: "HOSTNAME", value: "spring-boot-kubernetes-mysql" },
                                        { name: "OTEL_SERVICE_NAME", value: "otel-lgtm" },
                                    ]
                                }
                            ]
                        }
                    }
                }
            }
        ],
        service: [
            {
                metadata: {
                    labels: {
                        app: "spring-boot"
                    },
                    name: "demo",
                    namespace: "monitoring"
                },
                spec: {
                    ports: [
                        {
                            name: "spring-boot",
                            port: 8080,
                            protocol: "TCP",
                            targetPort: 8080,
                        }
                    ],
                    selector: {
                        app: "spring-boot",
                    }
                }
            },
        ],
        customresource: [
            {
                apiVersion: "apisix.apache.org/v2",
                kind: "ApisixRoute",
                metadata: {
                    name: "prometheus",
                    namespace: "monitoring"
                },
                spec: {
                    http: [
                        {
                            name: "root",
                            match: {
                                methods: ["GET", "HEAD"],
                                hosts: ["prometheus-lgtm.home.local"],
                                paths: ["/*"]
                            },
                            backends: [
                                {
                                    serviceName: "kubepromstack-prometheus",
                                    servicePort: 9090,
                                    resolveGranularity: "service"
                                }
                            ]
                        }
                    ]
                }
            },
            {
                apiVersion: "apisix.apache.org/v2",
                kind: "ApisixRoute",
                metadata: {
                    name: "grafana",
                    namespace: "monitoring"
                },
                spec: {
                    http: [
                        {
                            name: "root",
                            match: {
                                methods: ["GET", "HEAD", "POST", "PUT", "DELETE"],
                                hosts: ["grafana-lgtm.home.local"],
                                paths: ["/*"]
                            },
                            backends: [
                                {
                                    serviceName: "grafana",
                                    servicePort: 80,
                                    resolveGranularity: "service"
                                }
                            ],
                            /**
                            plugins: [
                                {
                                    name: "opentelemetry",
                                    enable: true,
                                    config: {
                                        sampler: {
                                            name: "always_on"
                                        }
                                    }
                                }
                            ]
                                 */
                        }
                    ]
                }
            },
            {
                apiVersion: "apisix.apache.org/v2",
                kind: "ApisixRoute",
                metadata: {
                    name: "alertmanager",
                    namespace: "monitoring"
                },
                spec: {
                    http: [
                        {
                            name: "root",
                            match: {
                                methods: ["GET", "HEAD", "POST", "PUT", "DELETE"],
                                hosts: ["alertmanager-lgtm.home.local"],
                                paths: ["/*"]
                            },
                            backends: [
                                {
                                    serviceName: "kubepromstack-alertmanager",
                                    servicePort: 9093,
                                    resolveGranularity: "service"
                                }
                            ]
                        }
                    ]
                }
            },
            {
                "apiVersion": "opentelemetry.io/v1alpha1",
                "kind": "Instrumentation",
                "metadata": {
                    "name": "otel-instrumentation",
                    namespace: "monitoring"
                },
                "spec": {
                    "exporter": {
                        "endpoint": "http://opentelemetry-collector:4318"
                    },
                    "propagators": [
                        "tracecontext",
                        "baggage"
                    ],
                    "sampler": {
                        "type": "parentbased_traceidratio",
                        "argument": "1"
                    },
                    "java": {
                        "env": [
                            {
                                "name": "OTEL_INSTRUMENTATION_KAFKA_ENABLED",
                                "value": "false"
                            },
                            {
                                "name": "OTEL_INSTRUMENTATION_REDISCALA_ENABLED",
                                "value": "false"
                            },
                            {
                                "name": "OTEL_EXPORTER_OTLP_PROTOCOL",
                                "value": "http/protobuf"
                            },
                            {
                                "name": "OTEL_JAVAAGENT_LOGGING",
                                "value": "simple"
                            },
                            {
                                "name": "OTEL_RESOURCE_ATTRIBUTES",
                                "value": "environment=prd"
                            }
                        ]
                    }
                }

            },
            {
                apiVersion: "apisix.apache.org/v2",
                kind: "ApisixRoute",
                metadata: {
                    name: "demo",
                    namespace: "monitoring"
                },
                spec: {
                    http: [
                        {
                            name: "root",
                            match: {
                                methods: ["GET", "HEAD"],
                                hosts: ["otel-lgtm-nodejs.home.local"],
                                paths: ["/*"]
                            },
                            backends: [
                                {
                                    serviceName: "demo",
                                    servicePort: 8080,
                                    resolveGranularity: "service"
                                }
                            ],
                            plugins: [
                                {
                                    name: "limit-conn",
                                    enable: true,
                                    config: {
                                        _meta: {
                                            disable: false
                                        },
                                        allow_degradation: false,
                                        burst: 5,
                                        conn: 20,
                                        default_conn_delay: 2,
                                        key: "remote_addr",
                                        key_type: "var",
                                        only_use_default_delay: false,
                                        rejected_code: 503
                                    }
                                },
                                {
                                    name: "opentelemetry",
                                    enable: true,
                                    config: {
                                        sampler: {
                                            name: "always_on"
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
        ]
    }
]

const namespace = new k8s.core.v1.Namespace('Namespace', { resources: resources })
const configmap = new k8s.core.v1.ConfigMap('ConfigMap', { resources: resources }, { dependsOn: [namespace] });
const release = new k8s.helm.v3.Release('Release', { resources: resources }, { dependsOn: [namespace] });
const deployment = new k8s.apps.v1.Deployment('Deployment', { resources: resources }, { dependsOn: [configmap] });
const service = new k8s.core.v1.Service('Service', { resources: resources }, { dependsOn: [release] });
const customresource = new k8s.apiextensions.CustomResource('CustomResource', { resources: resources }, { dependsOn: [release] });