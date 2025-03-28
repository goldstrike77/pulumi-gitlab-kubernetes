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
                        "pod-security.kubernetes.io/warn": "privileged"
                    }
                },
                spec: {}
            }
        ],
        configmap: [
            {
                metadata: {
                    name: "grafana-dashboards-mysql",
                    namespace: "monitoring",
                    annotations: {},
                    labels: {
                        grafana_dashboard: ""
                    }
                },
                data: {
                    "MySQL_Overview.json": fs.readFileSync('./dashboards/database/MySQL_Overview.json', 'utf8')
                }
            },
            {
                metadata: {
                    name: "grafana-dashboards-postgres",
                    namespace: "monitoring",
                    annotations: {},
                    labels: {
                        grafana_dashboard: ""
                    }
                },
                data: {
                    "PostgreSQL_Overview.json": fs.readFileSync('./dashboards/database/PostgreSQL_Overview.json', 'utf8')
                }
            },
            {
                metadata: {
                    name: "grafana-dashboards-universal",
                    namespace: "monitoring",
                    annotations: {},
                    labels: {
                        grafana_dashboard: ""
                    }
                },
                data: {
                    "WebSite_Overview.json": fs.readFileSync('./dashboards/universal/WebSite_Overview.json', 'utf8'),
                    "Redis_Overview.json": fs.readFileSync('./dashboards/universal/Redis_Overview.json', 'utf8'),
                    "Memcached_Overview.json": fs.readFileSync('./dashboards/universal/Memcached_Overview.json', 'utf8'),
                    "Loki_Kubernetes_Logs.json": fs.readFileSync('./dashboards/universal/Loki_Kubernetes_Logs.json', 'utf8')
                }
            },
            {
                metadata: {
                    name: "grafana-dashboards-platform",
                    namespace: "monitoring",
                    annotations: {},
                    labels: {
                        grafana_dashboard: ""
                    }
                },
                data: {
                    "Kubernetes_Cluster.json": fs.readFileSync('./dashboards/platform/Kubernetes_Cluster.json', 'utf8'),
                    "VMware_vSphere_Overview.json": fs.readFileSync('./dashboards/platform/VMware_vSphere_Overview.json', 'utf8')
                }
            },
            {
                metadata: {
                    name: "grafana-dashboards-operatingsystem",
                    namespace: "monitoring",
                    annotations: {},
                    labels: {
                        grafana_dashboard: ""
                    }
                },
                data: {
                    "Linux_System_Overview.json": fs.readFileSync('./dashboards/operatingsystem/Linux_System_Overview.json', 'utf8'),
                    "Linux_Disk_Performance.json": fs.readFileSync('./dashboards/operatingsystem/Linux_Disk_Performance.json', 'utf8'),
                    "Linux_Network_Overview.json": fs.readFileSync('./dashboards/operatingsystem/Linux_Network_Overview.json', 'utf8'),
                    "Linux_Disk_Space.json": fs.readFileSync('./dashboards/operatingsystem/Linux_Disk_Space.json', 'utf8')
                }
            },
            {
                metadata: {
                    name: "grafana-dashboards-others",
                    namespace: "monitoring",
                    annotations: {},
                    labels: {
                        grafana_dashboard: ""
                    }
                },
                data: {
                    "Cross_Server_Graphs.json": fs.readFileSync('./dashboards/others/Cross_Server_Graphs.json', 'utf8')
                }
            }
        ],
        release: [
            {
                namespace: "monitoring",
                name: "kube-prometheus-stack",
                chart: "oci://harbor.home.local/helm-charts/kube-prometheus-stack",
                version: "69.8.2",
                values: {
                    fullnameOverride: "kubepromstack",
                    defaultRules: { create: false },
                    alertmanager: { enabled: false },
                    grafana: { enabled: false },
                    kubeApiServer: {
                        enabled: true,
                        serviceMonitor: {
                            relabelings: [
                                { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "it" },
                                { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "prd" },
                                { sourceLabels: ["__address__"], targetLabel: "project", replacement: "container" },
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "rke-it-prd-infra-shared-01" },
                                { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "cn-north" },
                                { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                            ]
                        }
                    },
                    kubelet: {
                        enabled: true,
                        serviceMonitor: {
                            probes: true,
                            cAdvisorRelabelings: [
                                { sourceLabels: ["__metrics_path__"], targetLabel: "metrics_path" },
                                { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "it" },
                                { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "prd" },
                                { sourceLabels: ["__address__"], targetLabel: "project", replacement: "container" },
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "rke-it-prd-infra-shared-01" },
                                { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "cn-north" },
                                { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                            ],
                            relabelings: [
                                { sourceLabels: ["__metrics_path__"], targetLabel: "metrics_path" },
                                { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "it" },
                                { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "prd" },
                                { sourceLabels: ["__address__"], targetLabel: "project", replacement: "container" },
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "rke-it-prd-infra-shared-01" },
                                { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "cn-north" },
                                { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                            ]
                        }
                    },
                    kubeControllerManager: { enabled: false },
                    coreDns: {
                        enabled: true,
                        serviceMonitor: {
                            relabelings: [
                                { sourceLabels: ["__metrics_path__"], targetLabel: "metrics_path" },
                                { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "it" },
                                { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "prd" },
                                { sourceLabels: ["__address__"], targetLabel: "project", replacement: "container" },
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "rke-it-prd-infra-shared-01" },
                                { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "cn-north" },
                                { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                            ]
                        }
                    },
                    kubeEtcd: { enabled: false },
                    kubeScheduler: { enabled: false },
                    kubeProxy: { enabled: false },
                    kubeStateMetrics: { enabled: true },
                    "kube-state-metrics": {
                        fullnameOverride: "kube-state-metrics",
                        image: {
                            registry: "swr.cn-east-3.myhuaweicloud.com",
                            repository: "gcr-io/kube-state-metrics",
                            tag: "v2.15.0"
                        },
                        customLabels: podlabels,
                        metricLabelsAllowlist: ["nodes=[*]"],
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        },
                        prometheus: {
                            monitor: {
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
                        }
                    },
                    nodeExporter: { enabled: true },
                    "prometheus-node-exporter": {
                        fullnameOverride: "node-exporter",
                        image: {
                            registry: "swr.cn-east-3.myhuaweicloud.com",
                            repository: "quay-io/node-exporter",
                            tag: "v1.9.0"
                        },
                        resources: {
                            limits: { cpu: "50m", memory: "32Mi" },
                            requests: { cpu: "50m", memory: "32Mi" }
                        },
                        extraArgs: [
                            "--collector.filesystem.mount-points-exclude=^/(dev|proc|sys|var/lib/docker/.+|var/lib/kubelet/.+)($|/)",
                            "--collector.filesystem.fs-types-exclude=^(autofs|binfmt_misc|bpf|cgroup2?|configfs|debugfs|devpts|devtmpfs|fusectl|hugetlbfs|iso9660|mqueue|nsfs|overlay|proc|procfs|pstore|rpc_pipefs|securityfs|selinuxfs|squashfs|sysfs|tracefs)$",
                            "--collector.cpu.info"
                        ],
                        containerSecurityContext: {
                            readOnlyRootFilesystem: true,
                            allowPrivilegeEscalation: false,
                            seccompProfile: { type: "RuntimeDefault" },
                            capabilities: { drop: ["ALL"] }
                        },
                        podLabels: podlabels,
                        tolerations: [],
                        prometheus: {
                            monitor: {
                                enabled: true,
                                relabelings: [
                                    { sourceLabels: ["__meta_kubernetes_pod_node_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                    { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                    { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                    { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                    { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                    { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                    { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                                ],
                            }
                        }
                    },
                    prometheusOperator: {
                        enabled: true,
                        admissionWebhooks: {
                            enabled: true,
                            image: {
                                registry: "swr.cn-east-3.myhuaweicloud.com",
                                repository: "quay-io/admission-webhook",
                                tag: "v0.80.1"
                            },
                            patch: {
                                enabled: true,
                                image: {
                                    registry: "swr.cn-east-3.myhuaweicloud.com",
                                    repository: "gcr-io/kube-webhook-certgen",
                                    tag: "v1.5.1"
                                }
                            }
                        },
                        podLabels: podlabels,
                        logLevel: "warn",
                        serviceMonitor: {
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
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        },
                        image: {
                            registry: "swr.cn-east-3.myhuaweicloud.com",
                            repository: "quay-io/prometheus-operator",
                            tag: "v0.80.1"
                        },
                        prometheusConfigReloader: {
                            image: {
                                registry: "swr.cn-east-3.myhuaweicloud.com",
                                repository: "quay-io/prometheus-config-reloader",
                                tag: "v0.80.1"
                            },
                            resources: {
                                limits: { cpu: "200m", memory: "64Mi" },
                                requests: { cpu: "200m", memory: "64Mi" }
                            }
                        }
                    },
                    prometheus: {
                        enabled: true,
                        ingress: { enabled: false },
                        serviceMonitor: {
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "it" },
                                { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "prd" },
                                { sourceLabels: ["__address__"], targetLabel: "project", replacement: "container" },
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "rke-it-prd-infra-shared-01" },
                                { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "cn-north" },
                                { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                            ]
                        },
                        prometheusSpec: {
                            disableCompaction: true,
                            scrapeInterval: "60s",
                            scrapeTimeout: "30s",
                            evaluationInterval: "60s",
                            image: {
                                registry: "swr.cn-east-3.myhuaweicloud.com",
                                repository: "quay-io/prometheus",
                                tag: "v3.2.1"
                            },
                            externalLabels: { cluster: "rke-it-prd-infra-shared-01" },
                            externalUrl: "https://prometheus.home.local",
                            ruleSelectorNilUsesHelmValues: false,
                            serviceMonitorSelectorNilUsesHelmValues: false,
                            podMonitorSelectorNilUsesHelmValues: false,
                            probeSelectorNilUsesHelmValues: false,
                            retention: "2h",
                            retentionSize: "4096MB",
                            replicas: 1,
                            logLevel: "warn",
                            remoteWrite: [
                                {
                                    url: "http://mimir-distributor:8080/api/v1/push",
                                    headers: {
                                        "X-Scope-OrgID": "anonymous"
                                    }
                                }
                            ],
                            resources: {
                                limits: { cpu: "1000m", memory: "2048Mi" },
                                requests: { cpu: "1000m", memory: "2048Mi" }
                            },
                            storageSpec: {
                                volumeClaimTemplate: {
                                    spec: {
                                        storageClassName: "vsphere-san-sc",
                                        resources: {
                                            requests: {
                                                storage: "7Gi"
                                            }
                                        }
                                    }
                                }
                            },
                            additionalAlertRelabelConfigs: [
                                {
                                    regex: "prometheus|cluster",
                                    action: "labeldrop"
                                }
                            ]
                        }
                    }
                }
            },
            {
                namespace: "monitoring",
                name: "prometheus-blackbox-exporter",
                chart: "oci://harbor.home.local/helm-charts/prometheus-blackbox-exporter",
                version: "9.3.0",
                values: {
                    fullnameOverride: "blackbox-exporter",
                    image: {
                        registry: "swr.cn-east-3.myhuaweicloud.com",
                        repository: "quay-io/blackbox-exporter",
                        tag: "v0.26.0"
                    },
                    config: {
                        modules: {
                            http_2xx: {
                                prober: "http",
                                timeout: "5s",
                                http: {
                                    valid_http_versions: ["HTTP/1.1", "HTTP/2.0"],
                                    valid_status_codes: [],
                                    method: "GET",
                                    headers: {
                                        "Accept-Language": "en-US"
                                    },
                                    no_follow_redirects: false,
                                    fail_if_ssl: false,
                                    fail_if_not_ssl: false,
                                    tls_config: { insecure_skip_verify: true },
                                    preferred_ip_protocol: "ip4",
                                    ip_protocol_fallback: false
                                }
                            },
                            http_post_2xx: {
                                prober: "http",
                                timeout: "5s",
                                http: {
                                    valid_http_versions: ["HTTP/1.1", "HTTP/2.0"],
                                    valid_status_codes: [],
                                    method: "POST",
                                    headers: {
                                        "Accept-Language": "en-US",
                                        "Content-Type": "application/json"
                                    },
                                    body: "{}",
                                    no_follow_redirects: false,
                                    fail_if_ssl: false,
                                    fail_if_not_ssl: false,
                                    tls_config: { insecure_skip_verify: true },
                                    preferred_ip_protocol: "ip4",
                                    ip_protocol_fallback: false
                                }
                            }
                        }
                    },
                    securityContext: {
                        runAsUser: 1000,
                        runAsGroup: 1000,
                        readOnlyRootFilesystem: true,
                        runAsNonRoot: true,
                        allowPrivilegeEscalation: false,
                        capabilities: { drop: ["ALL"] },
                        seccompProfile: { type: "RuntimeDefault" }
                    },
                    resources: {
                        limits: { cpu: "100m", memory: "64Mi" },
                        requests: { cpu: "100m", memory: "64Mi" }
                    },
                    pod: {
                        labels: podlabels,
                    },
                    replicas: 1,
                    serviceMonitor: {
                        selfMonitor: {
                            enabled: true,
                            additionalRelabeling: [
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
                        }
                    },
                    prometheusRule: { enabled: false }
                }
            },
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
                        limits_config: {
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
                    gateway: { "enabled": false },
                    ingester: {
                        replicas: 3,
                        podLabels: podlabels,
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
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
                        }
                    },
                    distributor: {
                        replicas: 3,
                        maxUnavailable: 1,
                        podLabels: podlabels,
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        }
                    },
                    querier: {
                        replicas: 1,
                        podLabels: podlabels,
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        }
                    },
                    queryFrontend: {
                        replicas: 1,
                        podLabels: podlabels,
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        }
                    },
                    queryScheduler: {
                        replicas: 1,
                        podLabels: podlabels,
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        }
                    },
                    indexGateway: {
                        replicas: 1,
                        podLabels: podlabels,
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        }
                    },
                    compactor: {
                        replicas: 1,
                        podLabels: podlabels,
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
                    ruler: {
                        enabled: false,
                        replicas: 0,
                        podLabels: podlabels,
                        resources: {},
                        directories: {}
                    },
                    memcached: {
                        image: { repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/memcached" },
                        resources: {
                            limits: { cpu: "200m", memory: "1024Mi" },
                            requests: { cpu: "200m", memory: "1024Mi" }
                        }
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
                        podLabels: podlabels
                    },
                    chunksCache: {
                        enabled: true,
                        batchSize: 4,
                        parallelism: 5,
                        timeout: "2000ms",
                        defaultValidity: "0s",
                        replicas: 1,
                        allocatedMemory: 8192,
                        maxItemMemory: 5,
                        connectionLimit: 16384,
                        writebackSizeLimit: "500MB",
                        writebackBuffer: 500000,
                        writebackParallelism: 1,
                        initContainers: [],
                        podLabels: podlabels
                    },
                    "sidecar": {
                        image: { repository: "quay-io/k8s-sidecar" },
                        resources: {}
                    },
                    "monitoring": {
                        "serviceMonitor": {
                            "enabled": false,
                            "interval": "15s",
                            "relabelings": [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_customer"], targetLabel: "customer" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_environment"], targetLabel: "environment" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_project"], targetLabel: "project" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_group"], targetLabel: "group" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_datacenter"], targetLabel: "datacenter" },
                                { sourceLabels: ["__meta_kubernetes_pod_label_domain"], targetLabel: "domain" }
                            ],
                            "metricsInstance": {
                                "enabled": false
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
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        },
                        persistence: {
                            enabled: true,
                            size: "7Gi",
                            storageClass: "vsphere-san-sc"
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
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        }
                    },
                    compactor: {
                        replicas: 1,
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
                        },
                        config: {
                            compaction: {
                                block_retention: "168h"
                            }
                        }
                    },
                    querier: {
                        replicas: 1,
                        resources: {
                            limits: { cpu: "200m", memory: "256Mi" },
                            requests: { cpu: "200m", memory: "256Mi" }
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
                    server: { logLevel: "warn" },
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
                        extraArgs: ["-m 1000", "-I 2m", "-v"],
                        image: {
                            repository: "goldenimage/memcached",
                            tag: "1.6.38-alpine"
                        },
                        resources: {
                            limits: { cpu: "200m", memory: "1024Mi" },
                            requests: { cpu: "200m", memory: "1024Mi" }
                        }
                    },
                    memcachedExporter: {
                        enabled: true,
                        image: {
                            repository: "goldenimage/memcached-exporter",
                            tag: "v0.15.2"
                        },
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        }
                    },
                    metaMonitoring: {
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
                                    name: "DS_MIMIR",
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
                                compactor_blocks_retention_period: "168h",
                                max_label_names_per_series: 50
                            }
                        }
                    },
                    alertmanager: {
                        persistentVolume: {
                            enabled: true,
                            size: "2Gi",
                            storageClass: "vsphere-san-sc"
                        },
                        replicas: 1,
                        resources: {
                            limits: { cpu: "100m", memory: "128Mi" },
                            requests: { cpu: "100m", memory: "128Mi" }
                        }
                    },
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
                        }
                    },
                    memcached: {
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/memcached",
                            tag: "1.6.38-alpine"
                        },
                        resources: {
                            limits: { cpu: "200m", memory: "1024Mi" },
                            requests: { cpu: "200m", memory: "1024Mi" }
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
                        replicas: 1
                    },
                    "chunks-cache": {
                        enabled: true,
                        replicas: 1
                    },
                    "index-cache": {
                        enabled: true,
                        replicas: 1
                    },
                    "metadata-cache": {
                        enabled: true,
                        replicas: 1,
                        allocatedMemory: 512
                    },
                    "results-cache": {
                        enabled: true,
                        replicas: 1,
                        allocatedMemory: 512
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
                        replicas: 1,
                        resources: {
                            limits: { cpu: "500m", memory: "1024Mi" },
                            requests: { cpu: "500m", memory: "1024Mi" }
                        },
                        zoneAwareReplication: { enabled: false }
                    },
                    nginx: { enabled: false },
                    admin_api: { enabled: false },
                    gateway: { enabled: false }
                }
            }
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
                            ]
                        }
                    ]
                }
            }
        ]
    }
]

const namespace = new k8s.core.v1.Namespace('Namespace', { resources: resources })
const secret = new k8s.core.v1.Secret('Secret', { resources: resources }, { dependsOn: [namespace] });
const configmap = new k8s.core.v1.ConfigMap('ConfigMap', { resources: resources }, { dependsOn: [namespace] });
const release = new k8s.helm.v3.Release('Release', { resources: resources }, { dependsOn: [secret, configmap] });
const configfile = new k8s.yaml.ConfigFile('ConfigFile', { resources: resources }, { dependsOn: [release] });
const customresource = new k8s.apiextensions.CustomResource('CustomResource', { resources: resources }, { dependsOn: [namespace] });