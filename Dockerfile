FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5000

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["ExcelProcessor.csproj", "."]
RUN dotnet restore "ExcelProcessor.csproj"
COPY . .
WORKDIR "/src"
RUN dotnet build "ExcelProcessor.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ExcelProcessor.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ExcelProcessor.dll"]
