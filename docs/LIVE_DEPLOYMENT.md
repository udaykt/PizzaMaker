# Running the Kafka + Kubernetes stack live

This is the step-by-step for taking the Kafka pipeline and the Kubernetes/Helm
chart — which already exist in this repo and run locally via `docker compose`
and `minikube` — and putting them on the public internet, for free, forever.

## Why this is a *separate* deployment, not a replacement

The production frontend (`pizzamaker.pages.dev`, Cloudflare Pages) keeps talking
to the existing Render backend. This live k3s deployment is **additional** — a
second, clearly-labeled backend that proves the Kafka+K8s stack really runs,
reachable directly (Swagger UI, `curl`, `/actuator/health`).

That's deliberate. Render is a managed platform: if it goes down, that's
Render's problem and it comes back on its own. A self-hosted VM is *your*
problem — you patch it, you notice if it runs out of disk, you're the one who
gets paged (by nobody, because there's no pager, which is exactly the risk). Not
routing the main site's traffic through a box you personally administer keeps
the portfolio's actual uptime decoupled from your own ops availability. Once
this has run unattended for a few weeks without you touching it, revisit
whether to point the real frontend at it.

## What you end up with

```
                    (unchanged — still the primary demo)
Cloudflare Pages ──────────────────────────────────► Render + Neon
pizzamaker.pages.dev                                  pizzamaker-api.onrender.com

                    (new — the infra showcase)
http://<vm-ip>:8080 ───► k3s (2 backend pods) ───► Kafka (in-cluster) ───► Neon
                          Deployment scaled to 2,        (same database,
                          same code as Render's           separate connection)
                          image, pulled from GHCR
```

---

## Part 1 — Get a free-forever VM (Oracle Cloud)

Oracle Cloud's **Always Free** tier includes an ARM (Ampere A1) shape — up to 4
OCPUs / 24 GB RAM, split across up to 4 instances — with no time limit. This is
the only "free forever" compute tier confirmed generous enough to comfortably
run k3s + Kafka + two app pods side by side. (AWS/GCP/Azure free tiers are
12-months-then-billed; Oracle's is not. Verify current terms yourself before
committing — cloud free tiers change without much notice.)

1. Sign up at **oraclecloud.com** → **Start for free**. A card is required for
   identity verification; the Always Free resources are not billed.
2. Once in the console: **Compute → Instances → Create Instance**.
3. **Image**: Canonical Ubuntu 22.04 (aarch64/ARM build).
4. **Shape**: click *Change shape* → **Ampere → VM.Standard.A1.Flex** → set
   **2 OCPUs / 12 GB RAM** (leaves headroom in your 4/24 free allowance for a
   second instance later, and is comfortably enough for this stack).
5. **SSH keys**: let Oracle generate a key pair and download the private key
   (or paste your own public key). You cannot get in without this.
6. **Networking**: leave the default VCN/subnet, tick **"Assign a public IPv4
   address."**
7. Create. Note the **public IP** shown once it's running.

### Open the firewall — twice

Oracle blocks new inbound ports at **two independent layers**, and the #1
"why can't I reach my server" report is only fixing one of them.

**Layer 1 — the cloud console (Security List):**
Networking → Virtual Cloud Networks → your VCN → Security Lists → default
security list → **Add Ingress Rules**:
- Source CIDR: `0.0.0.0/0`, IP Protocol: TCP, Destination Port: `8080`

**Layer 2 — the OS firewall on the VM itself.** Oracle's stock Ubuntu image
ships `iptables` rules that reject everything except SSH by default, *even
though the console rule now allows it*. SSH in and fix it:

```bash
ssh -i /path/to/downloaded/key.pem ubuntu@<vm-ip>

sudo iptables -L INPUT --line-numbers            # find the line number of the REJECT rule
sudo iptables -I INPUT <line-before-reject> -m state --state NEW -p tcp --dport 8080 -j ACCEPT
sudo netfilter-persistent save                     # persist across reboots
```

If `curl http://<vm-ip>:8080/actuator/health` still times out later, this is
the first thing to re-check — one of these two layers is almost always the
cause.

---

## Part 2 — Install k3s

k3s is a certified, upstream-conformant Kubernetes distribution in a single
~70MB binary — the real thing, not a toy, and it's what the existing `k8s/`
manifests and Helm chart already target with no changes needed.

```bash
curl -sfL https://get.k3s.io | sh -

# k3s installs itself as a systemd service, so it — and everything you deploy
# to it — survives a VM reboot without you doing anything.
sudo systemctl status k3s

# kubectl is bundled; alias it so you don't type the full path every time
echo 'alias kubectl="sudo k3s kubectl"' >> ~/.bashrc
source ~/.bashrc

kubectl get nodes     # should show one Ready node
```

---

## Part 3 — Make the backend image pullable

The image needs to live somewhere this VM can reach — `minikube image load`
(what the local docs use) is a minikube-only side-loading mechanism and doesn't
apply here.

1. **Push the workflow already added to this repo**
   ([`.github/workflows/publish-image.yml`](../.github/workflows/publish-image.yml)).
   It builds a **multi-arch** (amd64 + arm64) image on every push to `master`
   that touches `backend/` and pushes it to
   `ghcr.io/<your-github-username>/pizzamaker-api`. Multi-arch matters because
   this VM is ARM — a plain `docker build` on a typical GitHub Actions runner
   only produces amd64, which would fail to pull on an A1 instance.
2. **Make the package public** (one-time, one click): on GitHub →
   your profile → **Packages** → `pizzamaker-api` → **Package settings** →
   **Change visibility → Public**. GHCR packages default to **private** even in
   a public repo, and a private package means `docker pull` on the VM gets a
   403 with no explanation. Skip this and nothing downstream will work.
3. Confirm it's pullable from the VM itself:
   ```bash
   sudo k3s crictl pull ghcr.io/<your-username>/pizzamaker-api:latest
   ```

---

## Part 4 — Deploy Kafka, then the backend

```bash
git clone https://github.com/<your-username>/PizzaMaker.git
cd PizzaMaker

# Kafka only — the in-cluster Postgres in k8s/deps/postgres.yaml is NOT needed;
# the database is Neon (see README "Database on Neon"), reached from outside
# the cluster over the internet like any other client.
kubectl apply -f k8s/deps/kafka.yaml
kubectl wait --for=condition=ready pod -l app=kafka --timeout=180s

# The backend, via Helm, layering values-live.yaml over the defaults.
# Fill in your real Neon connection details and fresh secrets here — nothing
# below should be copy-pasted with the placeholder values still in it.
helm install pizzamaker ./helm/pizzamaker \
  -f ./helm/pizzamaker/values-live.yaml \
  --set config.databaseUrl="jdbc:postgresql://<neon-host>/<db>?sslmode=require" \
  --set config.databaseUsername="<neon-user>" \
  --set secrets.databasePassword="<neon-password>" \
  --set secrets.jwtSecret="$(openssl rand -base64 32)" \
  --set secrets.webhookSecret="$(openssl rand -base64 24)"
```

Watch it come up:

```bash
kubectl get pods -w
# expect 2 pizzamaker pods (Deployment replicas: 2 — see values.yaml) plus the
# kafka pod, all Running

kubectl get svc pizzamaker-pizzamaker
# EXTERNAL-IP should equal your VM's public IP — that's k3s's built-in
# ServiceLB binding the LoadBalancer Service straight to the host
```

---

## Part 5 — Verify it's actually live, and actually Kafka-driven

```bash
curl http://<vm-ip>:8080/actuator/health
# {"status":"UP"}

# Swagger UI in a browser — the easiest "look, it's real" link to hand someone:
#   http://<vm-ip>:8080/swagger-ui/index.html
```

Prove the Kafka pipeline specifically — sign up, place an order via Swagger,
then:

```bash
kubectl logs -l app.kubernetes.io/name=pizzamaker -f --prefix
```

You should see the order walk itself `PENDING -> CONFIRMED -> PREPARING ->
READY` with no admin endpoint ever called — that's the self-perpetuating Kafka
lifecycle consumer described in `ARCHITECTURE.md`. With `--prefix`, the log
lines are tagged by pod name, which is the easiest way to see that the two
replicas really are sharing the work.

---

## Keeping it alive

- **Pod crashes**: restarted automatically by the Deployment's controller — that's
  what a Deployment is for.
- **VM reboots**: k3s comes back via systemd; Kafka and the backend come back
  because their Deployments are declarative state, not a script you ran once.
- **New code**: pushing to `master` rebuilds and republishes the image
  automatically (Part 3). Roll the running pods onto it with:
  ```bash
  kubectl rollout restart deployment pizzamaker-pizzamaker
  ```
  There is no auto-deploy-on-push to the cluster itself (that would need a
  second workflow with SSH access to the VM, or a pull-based tool like Flux/
  ArgoCD) — pulling the new image is a manual step, by design, so a bad push
  doesn't immediately take down the one thing you're trying to keep stable.
- **Disk**: `docker system df` / `sudo k3s crictl images` occasionally — old
  image layers accumulate. `sudo k3s crictl rmi --prune` clears unused ones.

## What's genuinely out of scope here

- **TLS** — this runs on plain HTTP at a bare IP. Fine for `curl`/Swagger; a
  browser will flag it as insecure if you ever point a real frontend at it. Adding
  a domain + Let's Encrypt (via Caddy or `cert-manager` + Traefik, which k3s
  already ships) is a follow-up, not done here.
- **Zero-downtime deploys** — `rollout restart` briefly drops to 1 healthy pod
  while the other cycles, same as any rolling update. Fine for a demo; would
  want `maxUnavailable: 0` tuning for anything that mattered.
- **Monitoring/alerting** — nothing pages you if this goes down. That's the
  honest trade-off of self-hosting for free, stated up front rather than
  discovered later.
