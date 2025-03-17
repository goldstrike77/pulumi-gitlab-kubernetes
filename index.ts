import * as pulumi from "@pulumi/pulumi";
import * as k8s from './pulumi-ts-module-kubernetes';
import * as fs from 'fs';

let config = new pulumi.Config();

const podlabels = {
    customer: "it",
    environment: "prd",
    project: "container",
    group: "k3s-it-prd-infra-shared-01",
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
                    labels: {}
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
                    defaultRules: { create: true },
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
                        ingress: {
                            enabled: true,
                            ingressClassName: "traefik",
                            hosts: ["alertmanager.home.local"]
                        },
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
                                tag: "v0.28.1"
                            },
                            logLevel: "warn",
                            replicas: 1,
                            storage: {
                                volumeClaimTemplate: {
                                    spec: {
                                        storageClassName: "local-path",
                                        resources: {
                                            requests: {
                                                storage: "3Gi"
                                            }
                                        }
                                    }
                                }
                            },
                            externalUrl: "https://alertmanager.home.local",
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
                            volumeMounts: [{
                                name: "cst-timezone",
                                mountPath: "/etc/localtime",
                                readOnly: true
                            }]
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
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "k3s-it-prd-infra-shared-01" },
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
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "k3s-it-prd-infra-shared-01" },
                                { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "cn-north" },
                                { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                            ],
                            relabelings: [
                                { sourceLabels: ["__metrics_path__"], targetLabel: "metrics_path" },
                                { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "it" },
                                { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "prd" },
                                { sourceLabels: ["__address__"], targetLabel: "project", replacement: "container" },
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "k3s-it-prd-infra-shared-01" },
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
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "k3s-it-prd-infra-shared-01" },
                                { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "cn-north" },
                                { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                            ]
                        }
                    },
                    kubeEtcd: { enabled: false },
                    kubeScheduler: { enabled: false },
                    kubeProxy: {
                        enabled: true,
                        serviceMonitor: {
                            relabelings: [
                                { sourceLabels: ["__metrics_path__"], targetLabel: "metrics_path" },
                                { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "it" },
                                { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "prd" },
                                { sourceLabels: ["__address__"], targetLabel: "project", replacement: "container" },
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "k3s-it-prd-infra-shared-01" },
                                { sourceLabels: ["__address__"], targetLabel: "datacenter", replacement: "cn-north" },
                                { sourceLabels: ["__address__"], targetLabel: "domain", replacement: "local" }
                            ]
                        }
                    },
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
                        ingress: {
                            enabled: true,
                            ingressClassName: "traefik",
                            hosts: ["prometheus.home.local"]
                        },
                        serviceMonitor: {
                            relabelings: [
                                { sourceLabels: ["__meta_kubernetes_pod_name"], separator: ";", regex: "^(.*)$", targetLabel: "instance", replacement: "$1", action: "replace" },
                                { sourceLabels: ["__address__"], targetLabel: "customer", replacement: "it" },
                                { sourceLabels: ["__address__"], targetLabel: "environment", replacement: "prd" },
                                { sourceLabels: ["__address__"], targetLabel: "project", replacement: "container" },
                                { sourceLabels: ["__address__"], targetLabel: "group", replacement: "k3s-it-prd-infra-shared-01" },
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
                            externalLabels: { cluster: "k3s-it-prd-infra-shared-01" },
                            externalUrl: "https://prometheus.home.local",
                            ruleSelectorNilUsesHelmValues: false,
                            serviceMonitorSelectorNilUsesHelmValues: false,
                            podMonitorSelectorNilUsesHelmValues: false,
                            probeSelectorNilUsesHelmValues: false,
                            retention: "2h",
                            retentionSize: "4096MB",
                            replicas: 1,
                            logLevel: "warn",
                            resources: {
                                limits: { cpu: "1000m", memory: "2048Mi" },
                                requests: { cpu: "1000m", memory: "2048Mi" }
                            },
                            storageSpec: {
                                volumeClaimTemplate: {
                                    spec: {
                                        storageClassName: "local-path",
                                        resources: {
                                            requests: {
                                                storage: "7Gi"
                                            }
                                        }
                                    }
                                }
                            },
                            additionalScrapeConfigs: `
- job_name: 'unAuthenticate exporters'
  tls_config:
    insecure_skip_verify: true
  consul_sd_configs:
    - server: '192.168.0.1:8501'
      token: ${config.require("consulToken")}
      refresh_interval: 60s
      services: ['alertmanager_exporter', 'azure-metrics_exporter', 'auditbeat_exporter', 'blackbox_exporter', 'consul_exporter', 'dellhw_exporter', 'docker_exporter', 'elasticsearch_exporter', 'filebeat_exporter', 'gitlab_exporter', 'grafana_exporter', 'haproxy_exporter', 'ingress-nginx_exporter', 'jenkins_exporter', 'jmx_exporter', 'kafka_exporter', 'keepalived_exporter', 'kibana_exporter', 'kube-state-metrics_exporter', 'logstash_exporter', 'minio_exporter', 'mongodb_exporter', 'mysqld_exporter', 'netdata_exporter', 'nginx_exporter', 'node_exporter', 'openldap_exporter', 'ossec_exporter', 'packetbeat_exporter', 'php-fpm_exporter', 'postgres_exporter', 'pushgateway_exporter', 'prometheus_exporter', 'rabbitmq_exporter', 'redis-sentinel_exporter', 'redis-server_exporter', 'skywalking_exporter', 'smokeping_exporter', 'snmp_exporter', 'statsd_exporter', 'thanos-bucket_exporter', 'thanos-compact_exporter', 'thanos-query_exporter', 'thanos-query-frontend_exporter', 'thanos-sidecar_exporter', 'thanos-store_exporter', 'vault_exporter', 'vmware_exporter', 'wmi_exporter', 'zookeeper_exporter']
      scheme: https
      tls_config:
        insecure_skip_verify: true
  relabel_configs:
    - regex: job
      action: labeldrop
    - source_labels: [__meta_consul_service_address]
      target_label: 'ipaddress'
    - regex: __meta_consul_service_metadata_(.+)
      action: labelmap
    - source_labels: [__meta_consul_service]
      replacement: '\$\{1\}'
      target_label: 'service'
      regex: '([^=]+)_exporter'
    - source_labels: [__meta_consul_service_metadata_metrics_path]
      action: replace
      target_label: __metrics_path__
      regex: (.+)
    - source_labels: [__meta_consul_service_metadata_scheme]
      action: replace
      target_label: __scheme__
      regex: (.+)
- job_name: 'Authenticate exporters'
  basic_auth:
    username: 'prometheus'
    password: 'tj@VH9ECytRF'
  tls_config:
    insecure_skip_verify: true
  consul_sd_configs:
    - server: '192.168.0.1:8501'
      token: ${config.require("consulToken")}
      refresh_interval: 60s
      services: ['alerta_exporter', 'graylog_exporter']
      scheme: https
      tls_config:
        insecure_skip_verify: true
  relabel_configs:
    - regex: job
      action: labeldrop
    - source_labels: [__meta_consul_service_address]
      target_label: 'ipaddress'
    - regex: __meta_consul_service_metadata_(.+)
      action: labelmap
    - source_labels: [__meta_consul_service]
      replacement: '\$\{1\}'
      target_label: 'service'
      regex: '([^=]+)_exporter'
    - source_labels: [__meta_consul_service_metadata_metrics_path]
      action: replace
      target_label: __metrics_path__
      regex: (.+)
    - source_labels: [__meta_consul_service_metadata_scheme]
      action: replace
      target_label: __scheme__
      regex: (.+)
- job_name: 'Probers'
  consul_sd_configs:
    - server: '192.168.0.1:8501'
      token: ${config.require("consulToken")}
      refresh_interval: 60s
      services: ['blackbox_exporter_prober', 'smokeping_prober_prober', 'snmp_exporter_prober']
      scheme: https
      tls_config:
        insecure_skip_verify: true
  relabel_configs:
    - regex: job
      action: labeldrop
    - regex: __meta_consul_service_metadata_(.+)
      action: labelmap
    - source_labels: [__meta_consul_service_metadata_target]
      target_label: '__param_target'
    - source_labels: [__meta_consul_service_metadata_module]
      target_label: '__param_module'
    - source_labels: [__meta_consul_service_metadata_address]
      action: replace
      target_label: __address__
      regex: (.+)
    - source_labels: [__meta_consul_service_metadata_metrics_path]
      action: replace
      target_label: __metrics_path__
      regex: (.+)
`,
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
                version: "6.28.0",
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
                        resources: {},
                        persistence: {
                            enabled: true,
                            claims: [
                                {
                                    name: "data",
                                    size: "7Gi",
                                    storageClass: "local-path"
                                }
                            ]
                        }
                    },
                    distributor: {
                        replicas: 3,
                        maxUnavailable: 1,
                        podLabels: podlabels,
                        resources: {},
                    },
                    querier: {
                        replicas: 1,
                        podLabels: podlabels,
                        resources: {}
                    },
                    queryFrontend: {
                        replicas: 1,
                        podLabels: podlabels,
                        resources: {}
                    },
                    queryScheduler: {
                        replicas: 1,
                        podLabels: podlabels,
                        resources: {}
                    },
                    indexGateway: {
                        replicas: 1,
                        podLabels: podlabels,
                        resources: {}
                    },
                    compactor: {
                        replicas: 1,
                        podLabels: podlabels,
                        resources: {},
                        persistence: {
                            enabled: true,
                            size: "7Gi",
                            storageClass: "local-path"
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
                        image: { repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/memcached" }
                    },
                    memcachedExporter: {
                        image: { repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/memcached-exporter" },
                        resources: {
                            limits: { cpu: "200m", memory: "64Mi" },
                            requests: { cpu: "200m", memory: "64Mi" }
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
                            "enabled": true,
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
                    backend: { "replicas": 0 },
                    read: { "replicas": 0 },
                    write: { "replicas": 0 },
                    singleBinary: { "replicas": 0 }
                }
            },
            {
                namespace: "monitoring",
                name: "grafana",
                chart: "oci://harbor.home.local/helm-charts/grafana",
                version: "6.57.4",
                values: {
                    replicas: 1,
                    image:
                    {
                        repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/grafana",
                        tag: "9.5.5",
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
                    ingress: {
                        enabled: true,
                        ingressClassName: "traefik",
                        hosts: ["grafana.home.local"],
                    },
                    resources: {
                        limits: { cpu: "200m", memory: "384Mi" },
                        requests: { cpu: "200m", memory: "384Mi" }
                    },
                    persistence: {
                        enabled: true,
                        storageClassName: "local-path",
                        size: "7Gi"
                    },
                    initChownData: {
                        enabled: true,
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/docker-io/busybox",
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
                                    url: "http://tempo-query-frontend.tracing:3100",
                                    version: 1
                                },
                                {
                                    name: "DS_LOKI",
                                    type: "loki",
                                    access: "proxy",
                                    url: "http://loki-query-frontend:3100",
                                    version: 1,
                                    jsonData: {
                                        maxLines: 5000
                                    },
                                    derivedFields: {
                                        datasourceUid: "",
                                        matcherRegex: "(?:traceID|trace_id)=(\\w+)",
                                        name: "TraceID",
                                        url: "${__value.raw}"
                                    }
                                }
                            ]
                        }
                    },
                    "grafana.ini": {
                        "auth.azuread": {
                            name: "Microsoft Entra ID",
                            enabled: true,
                            allow_sign_up: true,
                            client_id: "7d91f7eb-2dcb-4989-9b11-94bbf2322be5",
                            client_secret: config.require("client_secret"),
                            auth_url: "https://login.microsoftonline.com/e824e20c-c5d7-4a69-adb1-3494404763a5/oauth2/v2.0/authorize",
                            token_url: "https://login.microsoftonline.com/e824e20c-c5d7-4a69-adb1-3494404763a5/oauth2/v2.0/token",
                            role_attribute_strict: false
                        },
                        server: {
                            root_url: "https://grafana.home.local",
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
                        //                        grafana_net: { url: "https://grafana.net" },
                        user: {
                            default_theme: "dark",
                            home_page: ""
                        },
                        // tracing: { type: "jaeger" },
                        // "tracing.jaeger": {
                        //     address: "tempo-distributor.tracing.svc.cluster.local:6831",
                        //     zipkin_propagation: true
                        // }
                    },
                    sidecar: {
                        image: {
                            repository: "swr.cn-east-3.myhuaweicloud.com/quay-io/k8s-sidecar",
                            tag: "1.24.3"
                        },
                        resources: {
                            limits: { cpu: "50m", memory: "128Mi" },
                            requests: { cpu: "50m", memory: "128Mi" }
                        },
                        dashboards: { enabled: true, label: "grafana_dashboard" }
                    }
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