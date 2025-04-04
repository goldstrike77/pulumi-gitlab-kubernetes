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
/**
            {
                namespace: "monitoring",
                name: "kube-prometheus-stack",
                chart: "oci://harbor.home.local/helm-charts/kube-prometheus-stack",
                version: "70.4.1",
                values: {
                    fullnameOverride: "kubepromstack",
                    crds: {
                        enabled: true,
                        upgradeJob: {
                            enabled: true,
                            forceConflicts: true,
                            image: {
                                busybox: {
                                    repository: "docker-io/busybox",
                                    tag: "1.36.1"
                                },
                                kubectl: {
                                    repository: "docker-io/kubectl",
                                    tag: "1.31.3-debian-12-r1"
                                }
                            },
                            resources: {
                                limits: { cpu: "100m", memory: "64Mi" },
                                requests: { cpu: "100m", memory: "64Mi" }
                            }
                        }
                    },
                    defaultRules: { create: false },
                    global: {
                        imageRegistry: "swr.cn-east-3.myhuaweicloud.com"
                    },
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
infoING ☢
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
                    <strong style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; color: #ff0000; margin: 0;">[{{ .Alerts.Firing | len }}] infoING ☢</strong>
 
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
                                repository: "quay-io/alertmanager",
                                tag: "v0.28.1"
                            },
                            logLevel: "info",
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
                                repository: "quay-io/admission-webhook",
                                tag: "v0.81.0"
                            },
                            patch: {
                                enabled: true,
                                image: {
                                    repository: "gcr-io/kube-webhook-certgen",
                                    tag: "v1.5.2"
                                }
                            }
                        },
                        podLabels: podlabels,
                        logLevel: "info",
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
                            repository: "quay-io/prometheus-operator",
                            tag: "v0.81.0"
                        },
                        prometheusConfigReloader: {
                            image: {
                                repository: "quay-io/prometheus-config-reloader",
                                tag: "v0.81.0"
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
                            scrapeInterval: "60s",
                            scrapeTimeout: "30s",
                            evaluationInterval: "60s",
                            image: {
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
                            tsdb: {
                                outOfOrderTimeWindow: "30m"
                            },
                            walCompression: false,
                            replicas: 1,
                            logLevel: "info",
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
                            ],
                            additionalConfig: {
                                otlp: {
                                    keepIdentifyingResourceAttributes: true,
                                    translationStrategy: "NoUTF8EscapingWithSuffixes",
                                    promoteResourceAttributes: [
                                        "service.instance.id",
                                        "service.name",
                                        "service.namespace",
                                        "deployment.environment.name",
                                        "service.version",
                                        "cloud.availability_zone",
                                        "cloud.region",
                                        "container.name",
                                        "deployment.environment",
                                        "k8s.cluster.name",
                                        "k8s.container.name",
                                        "k8s.cronjob.name",
                                        "k8s.daemonset.name",
                                        "k8s.deployment.name",
                                        "k8s.job.name",
                                        "k8s.namespace.name",
                                        "k8s.pod.name",
                                        "k8s.replicaset.name",
                                        "k8s.statefulset.name"
                                    ]
                                }
                            }
                        }
                    }
                }
            },
 */           
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
                            limits: { cpu: "2000m", memory: "4096Mi" },
                            requests: { cpu: "2000m", memory: "4096Mi" }
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
                                compactor_blocks_retention_period: "168h",
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
                            "otlphttp/traces": {
                                endpoint: "http://tempo-distributor:4318",
                                tls: { insecure: true }
                            },
                            "otlphttp/logs": {
                                endpoint: "http://loki-distributor:3100/otlp",
                                tls: { insecure: true }
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
                            "extensions": [
                                "health_check"
                            ],
                            "pipelines": {
                                "traces": {
                                    "receivers": [
                                        "otlp",
                                        "jaeger",
                                        "zipkin"
                                    ],
                                    "processors": [
                                        "memory_limiter",
                                        "batch"
                                    ],
                                    "exporters": [
                                        "otlphttp/traces"
                                    ]
                                },
                                "metrics": {
                                    "receivers": [
                                        "otlp",
                                        "prometheus"
                                    ],
                                    "processors": [
                                        "memory_limiter",
                                        "batch"
                                    ],
                                    "exporters": [
                                        "otlphttp/metrics"
                                    ]
                                },
                                "logs": {
                                    "receivers": [
                                        "otlp"
                                    ],
                                    "processors": [
                                        "memory_limiter",
                                        "batch"
                                    ],
                                    "exporters": [
                                        "otlphttp/logs"
                                    ]
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
            }
        ],
        deployment: [
            {
                metadata: {
                    name: "otel-lgtm-nodejs",
                    namespace: "monitoring"
                },
                spec: {
                    replicas: 1,
                    selector: {
                        matchLabels: {
                            app: "otel-lgtm-nodejs"
                        }
                    },
                    template: {
                        metadata: {
                            labels: {
                                app: "otel-lgtm-nodejs",
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
                                    name: "otel-lgtm-nodejs",
                                    image: "registry.cn-hangzhou.aliyuncs.com/goldenimage/otel-lgtm:nodejs-v0.1@sha256:230084cf2452728da9940dad2883808f889ad6c62fc4bb0c495e94a85cd5924d",
                                    resources: {
                                        limits: { cpu: "2000m", memory: "256Mi" },
                                        requests: { cpu: "2000m", memory: "256Mi" }
                                    },
                                    ports: [
                                        {
                                            containerPort: 8080,
                                            protocol: "TCP"
                                        }
                                    ],
                                    env: [
                                        { name: "OTEL_SERVICE_NAME", value: "otel-lgtm-nodejs" },
                                        { name: "OTEL_SERVICE_VERSION", value: "0.1.0" },
                                        { name: "OTEL_RESOURCE_ATTRIBUTES", value: "environment=prd" },
                                        { name: "OTEL_EXPORTER_OTLP_ENDPOINT", value: "http://opentelemetry-collector:4318" }
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
                        app: "otel-lgtm-nodejs"
                    },
                    name: "otel-lgtm-nodejs",
                    namespace: "monitoring"
                },
                spec: {
                    selector: {
                        app: "otel-lgtm-nodejs"
                    },
                    ports: [
                        {
                            name: "otel-lgtm-nodejs",
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
                            ],
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
                    name: "otel-lgtm-nodejs",
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
                                    serviceName: "otel-lgtm-nodejs",
                                    servicePort: 8080,
                                    resolveGranularity: "service"
                                }
                            ],
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
const deployment = new k8s.apps.v1.Deployment('Deployment', { resources: resources }, { dependsOn: [release] });
const service = new k8s.core.v1.Service('Service', { resources: resources }, { dependsOn: [release] });
const customresource = new k8s.apiextensions.CustomResource('CustomResource', { resources: resources }, { dependsOn: [release] });