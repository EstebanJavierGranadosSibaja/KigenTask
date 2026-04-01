$ErrorActionPreference = 'Stop'

function Invoke-Step {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Uri,
        [hashtable]$Headers,
        [AllowNull()]
        [string]$Body = $null
    )

    try {
        if ([string]::IsNullOrEmpty($Body)) {
            $response = Invoke-RestMethod -Method $Method -Uri $Uri -Headers $Headers
        } else {
            $response = Invoke-RestMethod -Method $Method -Uri $Uri -Headers $Headers -ContentType 'application/json' -Body $Body
        }
        Write-Output ("{0}: OK" -f $Name)
        return $response
    } catch {
        Write-Output ("{0}: FAIL - {1}" -f $Name, $_.Exception.Message)

        if ($_.ErrorDetails.Message) {
            Write-Output $_.ErrorDetails.Message
        } elseif ($_.Exception.Response) {
            $stream = $_.Exception.Response.GetResponseStream()
            if ($stream) {
                $reader = New-Object System.IO.StreamReader($stream)
                Write-Output ($reader.ReadToEnd())
                $reader.Close()
            }
        }

        exit 1
    }
}

$base = 'http://localhost:8080/api/v1'
$suffix = Get-Random -Minimum 1000 -Maximum 9999
$username = "esteban$suffix"
$email = "esteban$suffix@example.com"
$password = 'Password123!'

$register = @{
    username = $username
    email = $email
    password = $password
    fullName = 'Esteban'
} | ConvertTo-Json

$login = @{
    usernameOrEmail = $username
    password = $password
} | ConvertTo-Json

$null = Invoke-Step -Name 'Register' -Method 'Post' -Uri "$base/auth/register" -Body $register
$loginResponse = Invoke-Step -Name 'Login' -Method 'Post' -Uri "$base/auth/login" -Body $login

$authHeaders = @{ Authorization = "Bearer $($loginResponse.token)" }
$me = Invoke-Step -Name 'Profile' -Method 'Get' -Uri "$base/users/me" -Headers $authHeaders

$project = @{
    name = "Proyecto Demo $suffix"
    projectKey = "KG$suffix"
    description = 'Proyecto de prueba'
} | ConvertTo-Json

$projectResponse = Invoke-Step -Name 'CreateProject' -Method 'Post' -Uri "$base/projects" -Headers $authHeaders -Body $project

$task = @{
    projectId = $projectResponse.id
    title = 'Primera tarea'
    description = 'Creada en smoke test'
    priority = 'HIGH'
} | ConvertTo-Json

$taskResponse = Invoke-Step -Name 'CreateTask' -Method 'Post' -Uri "$base/tasks" -Headers $authHeaders -Body $task

$comment = @{ content = 'Comentario inicial' } | ConvertTo-Json
$commentResponse = Invoke-Step -Name 'AddComment' -Method 'Post' -Uri "$base/tasks/$($taskResponse.id)/comments" -Headers $authHeaders -Body $comment

$tasks = Invoke-Step -Name 'ListTasks' -Method 'Get' -Uri "$base/tasks?projectId=$($projectResponse.id)" -Headers $authHeaders

Write-Output ("SMOKE_OK user={0} projectId={1} taskId={2} commentId={3} tasksFound={4}" -f $me.username, $projectResponse.id, $taskResponse.id, $commentResponse.id, $tasks.Count)
