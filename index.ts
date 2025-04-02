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
                    alertmanager: {
                        enabled: true,
                        config: {
                            global: {
                                http_config: {
                                    tls_config: {
                                        insecure_skip_verify: true
                                    }
                                },
                                resolve_timeout: "5m",
                                smtp_smarthost: "127.0.0.1:25",
                                smtp_from: "do-not-reply@example.com",
                                smtp_require_tls: false,
                                smtp_auth_username: "do-not-reply@example.com",
                                smtp_auth_password: "password"
                            },
                            route: {
                                group_by: ["alertname", "cluster", "service"],
                                group_wait: "45s",
                                group_interval: "5m",
                                repeat_interval: "24h",
                                receiver: "null",
                                routes: [
                                    {
                                        receiver: "grafana-oncall",
                                        continue: true
                                    },
                                    //{
                                    //    receiver: 'email',
                                    //    continue: true
                                    //},
                                    {
                                        matchers: ["alertname = Watchdog"],
                                        receiver: 'null',
                                        continue: false
                                    },
                                ]
                            },
                            inhibit_rules: [
                                {
                                    source_matchers: ["severity = P1"],
                                    target_matchers: ["severity =~ P2|P3|P4"],
                                    equal: ['alertname', 'cluster', 'service']
                                },
                                {
                                    source_matchers: ["severity = P2"],
                                    target_matchers: ["severity =~ P3|P4"],
                                    equal: ['alertname', 'cluster', 'service']
                                },
                                {
                                    source_matchers: ["severity = P3"],
                                    target_matchers: ["severity = P4"],
                                    equal: ['alertname', 'cluster', 'service']
                                }
                            ],
                            receivers: [
                                {
                                    name: "null"
                                },
                                {
                                    name: "email",
                                    email_configs: [
                                        {
                                            send_resolved: true,
                                            headers: {
                                                subject: "[ {{ .Status | toUpper }} - {{ .CommonLabels.severity | toUpper }} ] Alertmanager notify for {{ .CommonLabels.alertname }}"
                                            },
                                            to: "somebody@example.com"
                                        }
                                    ]
                                },
                                {
                                    name: "grafana-oncall",
                                    webhook_configs: [
                                        {
                                            url: "http://oncall-engine.oncall.svc.cluster.local:8080/integrations/v1/alertmanager/R6BlJsL6jf6xH5MSFHwJ2jNdN/",
                                            send_resolved: true
                                        }
                                    ]
                                }
                            ],
                            templates: ["/etc/alertmanager/config/*.tmpl"]
                        },
                        templateFiles: {
                            "default.tmpl": `
{{ define "__description" }}{{ end }}      
{{ define "__text_alert_firing_list" }}{{ range . }}
Start: {{ .StartsAt.Local.Format "Mon, 02 Jan 2006 15:04:05 MST" }}
{{ range .Labels.SortedPairs }}{{ .Name | title }}: {{ .Value }}
{{ end }}{{ range .Annotations.SortedPairs }}{{ .Name | title }}: {{ .Value }}{{ end }}
{{ end }}{{ end }}      
{{ define "__text_alert_resolved_list" }}{{ range . }}
Start: {{ .StartsAt.Local.Format "Mon, 02 Jan 2006 15:04:05 MST" }}
End:   {{ .EndsAt.Local.Format "Mon, 02 Jan 2006 15:04:05 MST" }}
Duration: {{ (.EndsAt.Sub .StartsAt).Truncate 1000000000 }}
{{ range .Labels.SortedPairs }}{{ .Name | title }}: {{ .Value }}
{{ end }}{{ range .Annotations.SortedPairs }}{{ .Name | title }}: {{ .Value }}{{ end }}
{{ end }}{{ end }}      
{{ define "wechat.default.message" }}{{ if gt (len .Alerts.Firing) 0 -}}
WARNING ☢
{{ template "__text_alert_firing_list" .Alerts.Firing }}
{{- end }}{{ if gt (len .Alerts.Resolved) 0 -}}
RESOLVED ❀
{{ template "__text_alert_resolved_list" .Alerts.Resolved }}
{{- end }}
{{- end }}
{{ define "wechat.default.api_secret" }}{{ end }}
{{ define "wechat.default.to_user" }}{{ end }}
{{ define "wechat.default.to_party" }}{{ end }}
{{ define "wechat.default.to_tag" }}{{ end }}
{{ define "wechat.default.agent_id" }}{{ end }}    


{{ define "email.default.html" }}
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<!--
Style and HTML derived from https://github.com/mailgun/transactional-email-templates

The MIT License (MIT)

Copyright (c) 2014 Mailgun

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
-->
<html xmlns="http://www.w3.org/1999/xhtml" xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
<head style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
<meta name="viewport" content="width=device-width" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />

</head>

<body itemscope="" itemtype="http://schema.org/EmailMessage" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; height: 100%; line-height: 1.6em; width: 100% !important; background-color: #f6f6f6; margin: 0; padding: 0;" bgcolor="#f6f6f6">

<table style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; background-color: #f6f6f6; margin: 0;" bgcolor="#f6f6f6">
  <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
    <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;" valign="top"></td>
    <td width="600" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; display: block !important; max-width: 600px !important; clear: both !important; width: 100% !important; margin: 0 auto; padding: 0;" valign="top">
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; max-width: 600px; display: block; margin: 0 auto; padding: 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; border-radius: 3px; background-color: #fff; margin: 0; border: 1px solid #e9e9e9;" bgcolor="#fff">
          <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
            <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 10px;" valign="top">
              <table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                  </td>
                </tr>
                {{ if gt (len .Alerts.Firing) 0 }}
                <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                    <strong style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; color: #ff0000; margin: 0;">[{{ .Alerts.Firing | len }}] WARNING ☢</strong>
 
                  </td>
                </tr>
                {{ end }}
                {{ range .Alerts.Firing }}
                <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                    Start: {{ .StartsAt.Local.Format "Mon, 02 Jan 2006 15:04:05 MST" }}<br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                    {{ range .Labels.SortedPairs }}{{ .Name | title }}: {{ .Value }}<br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />{{ end }}
                    {{ range .Annotations.SortedPairs }}{{ .Name | title }}: {{ .Value }}<br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />{{ end }}
                  </td>
                </tr>
                {{ end }}

                {{ if gt (len .Alerts.Resolved) 0 }}
                  {{ if gt (len .Alerts.Firing) 0 }}
                <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                    <br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                    <hr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                    <br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                  </td>
                </tr>
                  {{ end }}
                <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                    <strong style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; color: #44945e; margin: 0;">[{{ .Alerts.Resolved | len }}] RESOLVED ❀</strong>
 
                  </td>
                </tr>
                {{ end }}
                {{ range .Alerts.Resolved }}
                <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                  <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                    Start: {{ .StartsAt.Local.Format "Mon, 02 Jan 2006 15:04:05 MST" }}<br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                    End: &nbsp;{{ .EndsAt.Local.Format "Mon, 02 Jan 2006 15:04:05 MST" }}<br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                    Duration: {{ (.EndsAt.Sub .StartsAt).Truncate 1000000000 }}<br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />
                    {{ range .Labels.SortedPairs }}{{ .Name | title }}: {{ .Value }}<br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />{{ end }}
                    {{ range .Annotations.SortedPairs }}{{ .Name | title }}: {{ .Value }}<br style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;" />{{ end }}
                  </td>
                </tr>
                {{ end }}
              </table>
            </td>
          </tr>
        </table>

        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; clear: both; color: #999; margin: 0; padding: 20px;">
          <table width="100%" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
            <tr style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
            </tr>
          </table>
        </div></div>
    </td>
    <td style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;" valign="top"></td>
  </tr>
</table>

</body>
</html>

{{ end }}
`
                        },
                        ingress: { enabled: false },
                        serviceMonitor: {
                            relabelings: [
                                { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "it" },
                                { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "prd" },
                                { sourceLabels: ["__address__"], targetLabel: "project", replacement: "container" },
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "k3s-it-prd-infra-shared-01" },
                                { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "cn-north" },
                                { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                            ]
                        },
                        alertmanagerSpec: {
                            image: {
                                registry: "swr.cn-east-3.myhuaweicloud.com",
                                repository: "quay-io/alertmanager",
                                tag: "v0.27.0"
                            },
                            logLevel: "warn",
                            replicas: 1,
                            storage: {
                                volumeClaimTemplate: {
                                    spec: {
                                        storageClassName: "vsphere-san-sc",
                                        resources: {
                                            requests: {
                                                storage: "3Gi"
                                            }
                                        }
                                    }
                                }
                            },
                            externalUrl: "https://alertmanager-lgtm.home.local",
                            resources: {
                                limits: { cpu: "100m", memory: "64Mi" },
                                requests: { cpu: "100m", memory: "64Mi" }
                            },
                            volumes: [
                                {
                                    name: "cst-timezone",
                                    hostPath: {
                                        path: "/usr/share/zoneinfo/PRC",
                                        type: "File"
                                    }
                                }
                            ],
                            volumeMounts: [
                                {
                                    name: "cst-timezone",
                                    mountPath: "/etc/localtime",
                                    readOnly: true
                                }
                            ]
                        }
                    },
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
                        server: {
                            grpc_server_max_recv_msg_size: 524288000,
                            grpc_server_max_send_msg_size: 524288000
                        },
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
                            reject_old_samples_max_age: "168h",
                            retention_period: "168h",
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
                            limits: { cpu: "500m", memory: "1024Mi" },
                            requests: { cpu: "500m", memory: "1024Mi" }
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
                        zoneAwareReplication: {
                            enabled: true,
                            topologyKey: "kubernetes.io/hostname"
                        }
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
                            limits: { cpu: "1000m", memory: "4096Mi" },
                            requests: { cpu: "1000m", memory: "4096Mi" }
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
                            limits: { cpu: "1000m", memory: "4096Mi" },
                            requests: { cpu: "1000m", memory: "4096Mi" }
                        },
                        config: {
                            compaction: {
                                block_retention: "168h",
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
                        log: { mode: "console", level: "warn" },
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
                name: "kube-audit",
                chart: "oci://harbor.home.local/helm-charts/vector",
                version: "0.41.0",
                values: {
                    role: "Agent",
                    image: {
                        repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/vector",
                        tag: "0.45.0-distroless-libc"
                    },
                    podLabels: podlabels,
                    resources: {
                        limits: { cpu: "200m", memory: "256Mi" },
                        requests: { cpu: "200m", memory: "256Mi" }
                    },
                    nodeSelector: { "node-role.kubernetes.io/control-plane": "true" },
                    tolerations: [{ key: "CriticalAddonsOnly", operator: "Exists" }],
                    service: { enabled: false },
                    customConfig: {
                        data_dir: "/vector-data-dir",
                        api: { enabled: false, address: "127.0.0.1:8686", playground: false },
                        sources: { kubernetes_audit: { type: "file", max_line_bytes: 65536, include: ["/var/lib/rancher/rke2/server/logs/audit.log"] } },
                        transforms: {
                            kubernetes_audit_json: {
                                type: "remap",
                                inputs: ["kubernetes_audit"],
                                source: `. = parse_json!(.message)`
                            }
                        },
                        sinks: {
                            kubernetes_logs_loki: {
                                type: "loki",
                                inputs: ["kubernetes_audit_json"],
                                endpoint: "http://loki-distributor:3100",
                                labels: { scrape_job: "kube-audit", cluster: "rke-it-prd-infra-shared-01" },
                                compression: "none",
                                healthcheck: { enabled: false },
                                encoding: { codec: "json", except_fields: ["source_type"] },
                                buffer: { type: "disk", max_size: 4294967296, when_full: "block" },
                                batch: { max_events: 1024, timeout_secs: 3 }
                            }
                        }
                    },
                    extraVolumes: [
                        {
                            name: "varlibdockercontainers",
                            hostPath: {
                                path: "/var/lib/rancher/rke2/server/logs"
                            }
                        }
                    ],
                    extraVolumeMounts: [
                        {
                            name: "varlibdockercontainers",
                            mountPath: "/var/lib/rancher/rke2/server/logs",
                            readOnly: true
                        }
                    ],
                    persistence: { hostPath: { path: "/var/lib/vector/kube-audit" } },
                    podMonitor: {
                        enabled: true,
                        relabelings: [
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
                name: "kube-pod",
                chart: "oci://harbor.home.local/helm-charts/vector",
                version: "0.41.0",
                values: {
                    role: "Agent",
                    image: {
                        repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/vector",
                        tag: "0.45.0-distroless-libc"
                    },
                    podLabels: podlabels,
                    resources: {
                        limits: { cpu: "200m", memory: "256Mi" },
                        requests: { cpu: "200m", memory: "256Mi" }
                    },
                    tolerations: [{ key: "CriticalAddonsOnly", operator: "Exists" }],
                    service: { enabled: false },
                    customConfig: {
                        data_dir: "/vector-data-dir",
                        api: { enabled: false, address: "127.0.0.1:8686", playground: false },
                        sources: {
                            kubernetes_logs: {
                                type: "kubernetes_logs",
                                max_line_bytes: 65536
                            }
                        },
                        transforms: {
                            kubernetes_remap: {
                                type: "remap",
                                inputs: ["kubernetes_logs"],
                                source: `kubernetes = del(.kubernetes)
file = del(.file)
message = del(.message)
kubernetes_labels = encode_json(kubernetes.pod_labels)
kubernetes_labels = replace(kubernetes_labels, "app.kubernetes.io", "app_kubernetes_io")
kubernetes_labels = replace(kubernetes_labels, "helm.sh", "helm_sh")
. = parse_json!(kubernetes_labels)
.message = message
.ip = kubernetes.pod_ip
.container = kubernetes.container_name
.node = kubernetes.pod_node_name
.pod = kubernetes.pod_name
.namespace = kubernetes.pod_namespace
.timestamp = timestamp(.timestamp) ?? now()
.cluster = "rke-it-prd-infra-shared-01"`
                            },
                            kubernetes_filter: {
                                type: "filter",
                                inputs: ["kubernetes_remap"],
                                condition: '.app != "longhorn-manager" && .container != "metallb-speaker"'
                            }
                        },
                        sinks: {
                            kubernetes_logs_loki: {
                                type: "loki",
                                inputs: ["kubernetes_filter"],
                                endpoint: "http://loki-distributor:3100",
                                labels: { scrape_job: "kube-pod", cluster: "rke-it-prd-infra-shared-01" },
                                compression: "none",
                                healthcheck: { enabled: false },
                                encoding: { codec: "json", except_fields: ["source_type"] },
                                buffer: { type: "disk", max_size: 4294967296, when_full: "block" },
                                batch: { max_events: 1024, timeout_secs: 3 }
                            }
                        }
                    },
                    persistence: { hostPath: { path: "/var/lib/vector/kube-pod" } },
                    podMonitor: {
                        enabled: true,
                        relabelings: [
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
        ],
        deployment: [
            {
                metadata: {
                    name: "observability-lgtm",
                    namespace: "monitoring"
                },
                spec: {
                    replicas: 1,
                    selector: {
                        matchLabels: {
                            app: "observability-lgtm"
                        }
                    },
                    template: {
                        metadata: {
                            labels: {
                                app: "observability-lgtm",
                                customer: "it",
                                environment: "prd",
                                project: "container",
                                group: "rke-it-prd-infra-shared-01",
                                datacenter: "cn-north",
                                domain: "local"
                            },
                            annotations: {}
                        },
                        spec: {
                            containers: [
                                {
                                    name: "observability-lgtm",
                                    image: "registry.cn-hangzhou.aliyuncs.com/goldenimage/observability-lgtm:v0.1@sha256:bb5dfd51dc75ec9ff92cb3fdce049bbedc9569e54c3a5d514eb4f1f574f7e74d",
                                    resources: {
                                        limits: { cpu: "2000m", memory: "256Mi" },
                                        requests: { cpu: "2000m", memory: "256Mi" }
                                    },
                                    args: ["npm", "run", "index-with-tracer"],
                                    ports: [
                                        {
                                            containerPort: 8080,
                                            protocol: "TCP"
                                        },
                                        {
                                            containerPort: 9464,
                                            name: "prometheus",
                                            protocol: "TCP"
                                        },
                                    ],
                                    env: [
                                        { name: "ENVIRONMENT", value: "prd" },
                                        { name: "OTEL_SERVICE_NAME", value: "observability-lgtm" },
                                        { name: "OTEL_RESOURCE_ATTRIBUTES", value: "environment=prd" },
                                        { name: "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT", value: "http://tempo-distributor:4318/v1/traces" },
                                        { name: "OTEL_EXPORTER_OTLP_LOGS_ENDPOINT", value: "http://loki-distributor:3100" }

                                    ],
                                    livenessProbe: {
                                        failureThreshold: 10,
                                        tcpSocket: {
                                            port: 8080
                                        },
                                        initialDelaySeconds: 60,
                                        periodSeconds: 10,
                                        successThreshold: 1,
                                        timeoutSeconds: 30
                                    },
                                    readinessProbe: {
                                        failureThreshold: 3,
                                        tcpSocket: {
                                            port: 8080
                                        },
                                        initialDelaySeconds: 60,
                                        periodSeconds: 10,
                                        successThreshold: 1,
                                        timeoutSeconds: 10
                                    },
                                    imagePullPolicy: "IfNotPresent"
                                }
                            ],
                            restartPolicy: "Always"
                        }
                    }
                }
            }
        ],
        service: [
            {
                metadata: {
                    labels: {
                        app: "observability-lgtm"
                    },
                    name: "observability-lgtm",
                    namespace: "monitoring"
                },
                spec: {
                    selector: {
                        app: "observability-lgtm"
                    },
                    ports: [
                        {
                            name: "observability-lgtm",
                            port: 8080,
                            protocol: "TCP",
                            targetPort: 8080
                        }
                    ]
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
                apiVersion: "apisix.apache.org/v2",
                kind: "ApisixRoute",
                metadata: {
                    name: "observability-lgtm",
                    namespace: "monitoring"
                },
                spec: {
                    http: [
                        {
                            name: "root",
                            match: {
                                methods: ["GET", "HEAD"],
                                hosts: ["observability-lgtm.home.local"],
                                paths: ["/*"]
                            },
                            backends: [
                                {
                                    serviceName: "observability-lgtm",
                                    servicePort: 8080,
                                    resolveGranularity: "service"
                                }
                            ]
                        }
                    ]
                }
            },
            {
                apiVersion: "monitoring.coreos.com/v1",
                kind: "PodMonitor",
                metadata: {
                    name: "observability-lgtm",
                    namespace: "monitoring"
                },
                spec: {
                    podMetricsEndpoints: [
                        {
                            interval: "60s",
                            scrapeTimeout: "30s",
                            scheme: "http",
                            targetPort: "prometheus",
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { action: "replace", replacement: "it", sourceLabels: ["__address__"], targetLabel: "customer" },
                                { action: "replace", replacement: "prd", sourceLabels: ["__address__"], targetLabel: "environment" },
                                { action: "replace", replacement: "container", sourceLabels: ["__address__"], targetLabel: "project" },
                                { action: "replace", replacement: "rke-it-prd-infra-shared-01", sourceLabels: ["__address__"], targetLabel: "group" },
                                { action: "replace", replacement: "cn-north", sourceLabels: ["__address__"], targetLabel: "datacenter" },
                                { action: "replace", replacement: "local", sourceLabels: ["__address__"], targetLabel: "domain" },
                                { action: "replace", replacement: "observability-lgtm", sourceLabels: ["__address__"], targetLabel: "service" }
                            ]
                        }
                    ],
                    namespaceSelector: {
                        matchNames: ["monitoring"]
                    },
                    selector: {
                        matchLabels: {
                            app: "observability-lgtm"
                        }
                    }
                }
            }
        ]
    }
]

const namespace = new k8s.core.v1.Namespace('Namespace', { resources: resources })
const configmap = new k8s.core.v1.ConfigMap('ConfigMap', { resources: resources }, { dependsOn: [namespace] });
const release = new k8s.helm.v3.Release('Release', { resources: resources }, { dependsOn: [configmap] });
const deployment = new k8s.apps.v1.Deployment('Deployment', { resources: resources }, { dependsOn: [release] });
const service = new k8s.core.v1.Service('Service', { resources: resources }, { dependsOn: [deployment, release] });
const customresource = new k8s.apiextensions.CustomResource('CustomResource', { resources: resources }, { dependsOn: [service] });